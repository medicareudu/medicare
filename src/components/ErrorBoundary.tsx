import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-10 gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500">
            <AlertCircle size={28} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800 mb-1">
              {this.props.fallbackLabel || 'Something went wrong'}
            </div>
            <div className="text-xs text-slate-500 font-mono bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg max-w-md">
              {this.state.errorMessage}
            </div>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            className="flex items-center gap-2 text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 px-4 py-2 rounded-lg shadow transition"
          >
            <RefreshCw size={13} />
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
