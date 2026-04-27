import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="text-4xl mb-4">😵</div>
            <h1 className="text-xl font-extrabold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-gray-500 text-sm mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <Link
              to="/"
              onClick={() => this.setState({ hasError: false })}
              className="text-brand-600 hover:text-brand-800 font-semibold underline underline-offset-4 transition-colors duration-150"
            >
              Return to Home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
