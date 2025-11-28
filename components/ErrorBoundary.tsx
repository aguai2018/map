import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isSecurityError = this.state.error?.message?.includes('Blocked a frame') || 
                            this.state.error?.message?.includes('Location') ||
                            this.state.error?.message?.includes('SecurityError');

      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-50 text-white p-8">
          <div className="max-w-md bg-gray-900 border border-red-500/30 p-8 rounded-2xl shadow-2xl backdrop-blur-xl text-center">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-bold mb-3">Map Render Failed</h2>
            
            <div className="bg-black/40 p-4 rounded-lg mb-6 text-left">
              <p className="text-red-300 font-mono text-xs break-words">
                {this.state.error?.message || 'Unknown error occurred'}
              </p>
            </div>

            {isSecurityError ? (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm leading-relaxed">
                  This preview environment is blocking the 3D map engine for security reasons (iframe sandbox). 
                </p>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-200 text-sm">
                  <strong>Solution:</strong> Please open this page in a new tab to view the map correctly.
                </div>
                <button 
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-medium shadow-lg shadow-blue-900/20 mt-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </button>
              </div>
            ) : (
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;