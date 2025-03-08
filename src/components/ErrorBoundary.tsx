import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Prevent logging empty error objects to avoid console noise
    if (error && (error.message || error.stack)) {
      console.error(
        'Error caught by ErrorBoundary:',
        'Error name:', error?.name || 'Unknown',
        'Error message:', error?.message || 'No message',
        'Error stack:', error?.stack || 'No stack trace'
      );
    } else {
      // Silently handle empty error objects
      // This prevents the empty {} errors in the console
      console.debug('Empty error object or undefined error caught by ErrorBoundary');
    }
    
    // Log error info separately to avoid circular reference issues
    if (errorInfo && errorInfo.componentStack) {
      console.debug('Component stack:', errorInfo.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div style={{ padding: '16px', color: '#666' }}>
          <h3>Something went wrong</h3>
          <p>The component could not be loaded.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
