import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // This lifecycle method is called first when an error is thrown.
    console.log("ErrorBoundary getDerivedStateFromError caught:", error.message);

    // Check if the error is the specific ResizeObserver loop error.
    if (error.message && error.message.includes('ResizeObserver loop')) {
      console.log("--> It's the ResizeObserver error. Ignoring it.");
      // By returning a state that does NOT indicate an error, we prevent the fallback UI from rendering.
      return { hasError: false, error: null }; 
    }
    
    // For any other *real* error, update state so the fallback UI will be rendered.
    console.log("--> It's a real error. Preparing to show fallback UI.");
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    // This method is called after getDerivedStateFromError.
    // It's a good place for side effects, like logging to a service.
    
    // We only log errors that are NOT the ResizeObserver one.
    if (error.message && !error.message.includes('ResizeObserver loop')) {
      console.error("ErrorBoundary componentDidCatch logged a real error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI for real, critical errors.
      return (
        <div className="error-boundary-fallback">
          <h4>Something went wrong with the code editor.</h4>
          <p>Please try refreshing the page.</p>
        </div>
      );
    }

    // If there's no error, or if the error was the one we chose to ignore,
    // render the children components as normal.
    return this.props.children; 
  }
}

export default ErrorBoundary;

