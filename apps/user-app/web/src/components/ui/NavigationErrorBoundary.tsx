'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class NavigationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NavigationErrorBoundary caught an uncaught render error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/home';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[80vh] w-full flex flex-col items-center justify-center p-6 text-center bg-white max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-gray-900">Something went wrong</h2>
          <p className="text-xs text-gray-500 mt-1.5 max-w-xs leading-relaxed">
            This page ran into a temporary hiccup. Tapping reload usually resolves it.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={this.handleReload}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reload
            </button>
            <button
              onClick={this.handleHome}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#FF5A36] text-white hover:bg-[#ff4921] transition-all active:scale-95 shadow-sm"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
