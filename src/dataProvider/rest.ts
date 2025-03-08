import { DataProvider } from "react-admin";
import { fetchUtils } from "ra-core";
import simpleRestProvider from "ra-data-simple-rest";

// Define the API URL that matches the fake server configuration
const apiUrl = "http://localhost:4000";

// Mock data for fallback responses when the fake server fails
const MOCK_DATA = {
  customers: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    first_name: `Customer ${i + 1}`,
    last_name: 'Smith',
    email: `customer${i + 1}@example.com`,
    has_ordered: i % 2 === 0,
    last_seen: new Date().toISOString(),
  })),
  orders: Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    reference: `ORD-${i + 100}`,
    customer_id: i + 1,
    date: new Date().toISOString(),
    status: i % 2 === 0 ? 'delivered' : 'pending',
    total: 100 + i * 10,
  })),
  reviews: Array.from({ length: 3 }, (_, i) => ({
    id: i + 1,
    date: new Date().toISOString(),
    status: 'pending',
    customer_id: i + 1,
    product_id: i + 1,
    rating: 3 + i,
  })),
  products: Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    category_id: i % 3 + 1,
    reference: `PROD-${i + 100}`,
    width: 50 + i,
    height: 50 + i,
    price: 10 + i * 5,
    thumbnail: 'https://via.placeholder.com/150',
    image: 'https://via.placeholder.com/600x400',
    description: `Product ${i + 1} description`,
    stock: 10 + i * 5,
  })),
};

// Track failed requests to prevent infinite loops
const failedRequests = new Map<string, boolean>();
const MAX_RETRIES = 1; // Maximum number of retries for a request - reduced to 1 to fail faster
const retryCount = new Map<string, number>();

// Get fallback data for a resource
const getFallbackData = (resource: string, id?: string | number) => {
  if (!MOCK_DATA[resource as keyof typeof MOCK_DATA]) {
    return id ? { id } : [];
  }
  
  const resourceData = MOCK_DATA[resource as keyof typeof MOCK_DATA];
  
  if (id) {
    const item = resourceData.find((item: any) => item.id.toString() === id.toString());
    return item || { id };
  }
  
  return resourceData;
};

// Create a custom httpClient that logs requests and responses
const httpClient = (url: string, options: fetchUtils.Options = {}) => {
  // Generate a unique key for this request to track failures
  const requestKey = `${url}-${options.method || 'GET'}`;
  
  // Increment retry count for this request
  const currentRetries = retryCount.get(requestKey) || 0;
  retryCount.set(requestKey, currentRetries + 1);
  
  // Extract resource name from URL for fallback data
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  const resource = pathParts[0]; // First part of the path after the domain
  const id = pathParts[1]; // Second part might be an ID
  
  // Check if this request has already failed too many times to prevent infinite loops
  if (currentRetries > MAX_RETRIES || failedRequests.get(requestKey)) {
    console.log(`[HTTP Client] Using fallback data for ${url} after ${currentRetries} retries`);
    
    // Return mock data based on the resource and request type
    const fallbackData = getFallbackData(resource, id);
    const jsonResponse = Array.isArray(fallbackData) ? fallbackData : [fallbackData];
    
    // Return a mock response with fallback data
    return Promise.resolve({
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      body: JSON.stringify(jsonResponse),
      json: jsonResponse
    });
  }
  
  console.log(`[HTTP Client] Fetching ${url} with options:`, options);
  
  if (!options.headers) {
    options.headers = new Headers({ Accept: 'application/json' });
  }
  
  // Set a timeout to prevent hanging requests
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout for ${url}`));
    }, 2000); // 2 second timeout
  });
  
  // Race between the actual fetch and the timeout
  return Promise.race([
    fetchUtils.fetchJson(url, options),
    timeoutPromise
  ])
    .then(response => {
      console.log(`[HTTP Client] Response from ${url}:`, response);
      // Clear the failed flag if the request succeeds
      failedRequests.delete(requestKey);
      retryCount.delete(requestKey);
      return response;
    })
    .catch(error => {
      console.error(`[HTTP Client] Error fetching ${url}:`, error);
      // Mark this request as failed to prevent retries
      failedRequests.set(requestKey, true);
      throw error;
    });
};

// Create a base data provider using simpleRestProvider
const baseDataProvider = simpleRestProvider(apiUrl, httpClient);

// Create a wrapped data provider with better error handling
const dataProvider: DataProvider = new Proxy(baseDataProvider, {
  get: (target, name: string | symbol) => {
    // Handle non-string properties or the 'then' method (used in Promise)
    if (typeof name !== 'string' || name === 'then') {
      return Reflect.get(target, name);
    }
    
    // Get the original method
    const originalMethod = Reflect.get(target, name);
    if (typeof originalMethod !== 'function') {
      return originalMethod;
    }
    
    // Return a wrapped function with error handling
    return async (...args: unknown[]) => {
      const [resource, params] = args as [string, Record<string, unknown>];
      console.log(`[DataProvider] Calling ${name} on resource ${resource} with params:`, params);
      
      try {
        // Call the original method with a timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Operation timeout for ${name} on ${resource}`));
          }, 3000); // 3 second timeout for the entire operation
        });
        
        const result = await Promise.race([
          originalMethod.apply(target, args),
          timeoutPromise
        ]);
        
        console.log(`[DataProvider] ${name} result:`, result);
        return result;
      } catch (error) {
        console.error(`[DataProvider] Error in ${name} for ${resource}:`, error);
        
        // For read operations, return fallback data instead of throwing to prevent UI crashes
        if (name === 'getList' || name === 'getMany' || name === 'getManyReference') {
          const fallbackData = getFallbackData(resource);
          return { 
            data: fallbackData, 
            total: Array.isArray(fallbackData) ? fallbackData.length : 0 
          };
        }
        if (name === 'getOne') {
          const id = params.id as string | number;
          return { data: getFallbackData(resource, id) };
        }
        
        // For write operations, simulate success with the provided data
        if (name === 'create') {
          const data = params.data as Record<string, unknown>;
          return { data: { ...data, id: Date.now() } };
        }
        if (name === 'update') {
          const data = params.data as Record<string, unknown>;
          return { data };
        }
        if (name === 'delete') {
          return { data: { id: params.id } };
        }
        
        // For any other operation, return a basic success response
        return { data: {} };
      }
    };
  }
});

export default dataProvider;
