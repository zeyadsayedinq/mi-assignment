import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Mi-Assignment] Error:', error.message, info.componentStack?.slice(0, 200));
    // Report to Sentry if available
    try { (window as any)?.Sentry?.captureException(error); } catch {}
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isAr = localStorage.getItem('mi_lang') === 'ar';

    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white p-6" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-9 h-9 text-red-400" />
          </div>

          <h1 className="text-2xl font-black text-white mb-3">
            {isAr ? 'في مشكلة مؤقتة' : 'Something went wrong'}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            {isAr
              ? 'في خطأ حصل. ضغط على "إعادة تحميل" وهيرجع كل حاجة تمام.'
              : "An unexpected error occurred. Reload the page and everything will be back to normal."}
          </p>

          {/* Error detail (dev only) */}
          {import.meta.env.DEV && this.state.error && (
            <div className="bg-[#0A0B0E] border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-left">
              <p className="text-red-400 text-xs font-mono break-all">{this.state.error.message}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#22D3EE] text-black font-black rounded-xl hover:bg-white transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              {isAr ? 'إعادة تحميل' : 'Reload page'}
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-700 text-gray-400 font-bold rounded-xl hover:border-gray-500 hover:text-white transition-all"
            >
              {isAr ? 'الصفحة الرئيسية' : 'Go to homepage'}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
