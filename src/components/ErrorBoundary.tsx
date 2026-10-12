import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    const isChunk = error?.message?.includes('dynamically imported module') || error?.message?.includes('Failed to fetch');
    if (isChunk) {
      const lastReload = sessionStorage.getItem('shaheen_chunk_eb_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem('shaheen_chunk_eb_reload', now.toString());
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      const isChunkLoadError = this.state.error?.message?.includes('dynamically imported module') || this.state.error?.message?.includes('Failed to fetch');
      
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
          <div className="max-w-md w-full bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg p-6 shadow-sm text-center">
            <h1 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 break-words">
              {isChunkLoadError 
                ? 'A new app update was deployed. Please click below to load the latest version.'
                : (this.state.error?.message || 'An unexpected error occurred in the React application.')}
            </p>
            <button 
              onClick={() => {
                sessionStorage.removeItem('shaheen_chunk_eb_reload');
                sessionStorage.removeItem('shaheen_last_chunk_reload');
                window.location.href = window.location.origin + window.location.pathname + '?reload=' + Date.now();
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-sm font-semibold hover:bg-red-700 transition-colors"
            >
              {isChunkLoadError ? 'Load Latest Version' : 'Reload Application'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
