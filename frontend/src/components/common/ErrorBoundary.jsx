import React, { Component } from 'react';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center p-8 rounded-2xl bg-dark-800 border border-white/10 shadow-2xl">
            <div className="w-16 h-16 bg-accent-gold/10 text-accent-gold rounded-full flex items-center justify-center mx-auto mb-6">
              <FaExclamationTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              We encountered an unexpected error while loading this content. Don't worry, your watch progress is safe.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 bg-accent-gold hover:bg-accent-goldHover text-dark-900 font-semibold px-6 py-2.5 rounded-lg transition-all"
              >
                <FaRedo className="w-4 h-4" />
                <span>Return to Home</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-2.5 rounded-lg transition-all border border-white/10"
              >
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
