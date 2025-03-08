import { DataProvider } from "react-admin";
import fakeServerFactory from "../fakeServer";

// Declare our timestamp tracking without modifying the Window interface
// This avoids conflicts with the existing Window interface in types.ts
interface DataProviderLogTimestamps {
  [key: string]: number;
}

// Create a global variable for timestamp tracking
const logTimestamps: DataProviderLogTimestamps = {};

// Define the default data provider first so it can be referenced by the main function
const defaultDataProvider: DataProvider = {
  create: () => Promise.resolve({ data: { id: 0 } } as any),
  delete: () => Promise.resolve({ data: { id: 0 } } as any),
  deleteMany: () => Promise.resolve({} as any),
  getList: () => Promise.resolve({ data: [], total: 0 } as any),
  getMany: () => Promise.resolve({ data: [] } as any),
  getManyReference: () => Promise.resolve({ data: [], total: 0 } as any),
  getOne: () => Promise.resolve({ data: { id: 0 } } as any),
  update: () => Promise.resolve({ data: { id: 0 } } as any),
  updateMany: () => Promise.resolve({} as any),
};

const getDataProvider = async (type: string): Promise<DataProvider> => {
  try {
    console.log(`Setting up fake server with type: ${type}`);
    
    // Initialize the fake server first to ensure it's ready to intercept requests
    // Use the provided type parameter instead of the environment variable
    await fakeServerFactory(type);
    
    /**
     * This demo can work with either a fake REST server, or a fake GraphQL server.
     *
     * To avoid bundling both libraries, the dataProvider and fake server factories
     * use the import() function, so they are asynchronous.
     */
    if (type === "graphql") {
      console.log("Using GraphQL data provider");
      // Uncomment if you want to use GraphQL
      // return import("./graphql").then((factory) => factory.default());
    }
    
    console.log("Using REST data provider");
    // Make sure the REST data provider is loaded after the fake server is initialized
    return import("./rest").then((provider) => {
      console.log("REST data provider loaded");
      return provider.default;
    });
  } catch (error) {
    console.error("Error in getDataProvider:", error);
    // Return a simple data provider that does nothing in case of error
    return defaultDataProvider;
  }
};

export default (type: string) => {
  console.log("Initializing data provider with type:", type);
  // The fake servers require to generate data, which can take some time.
  // Here we start the server initialization but we don't wait for it to finish
  const dataProviderPromise = getDataProvider(type);

  // Instead we return this proxy which may be called immediately by react-admin if the
  // user is already signed-in. In this case, we simply wait for the dataProvider promise
  // to complete before requesting it the data.
  // If the user isn't signed in, we already started the server initialization while they see
  // the login page. By the time they come back to the admin as a signed-in user,
  // the fake server will be initialized.
  const dataProviderWithGeneratedData = new Proxy(defaultDataProvider, {
    get(_, name) {
      if (name === "supportAbortSignal") {
        return import.meta.env.MODE === "production";
      }
      return (resource: string, params: Record<string, unknown>) => {
        // Use a throttled logging mechanism to prevent console spam
        const logKey = `${String(name)}-${resource}`;
        
        const now = Date.now();
        const lastLog = logTimestamps[logKey] || 0;
        
        // Only log if more than 2 seconds have passed since the last identical log
        if (now - lastLog > 2000) {
          console.log(`Data provider method ${String(name)} called with resource: ${resource}`);
          logTimestamps[logKey] = now;
        }
        
        return dataProviderPromise.then(
          (dataProvider) => {
            try {
              return dataProvider[name.toString()](resource, params);
            } catch (error) {
              console.error(`Error in data provider method ${String(name)}:`, error);
              // Fall back to default provider if the real one fails
              return defaultDataProvider[name.toString()](resource, params);
            }
          },
          (error) => {
            console.error("Failed to initialize data provider:", error);
            // Fall back to default provider if initialization fails
            return defaultDataProvider[name.toString()](resource, params);
          }
        );
      };
    },
  });

  return dataProviderWithGeneratedData;
};
