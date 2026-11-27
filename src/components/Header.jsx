import { Shield, Lock, RotateCcw, Cpu } from 'lucide-react';

export default function Header({ onReset, hasContent }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        {/* Brand Identity */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
            <Shield className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                CipherSift
              </h1>
              <span className="hidden rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 sm:inline-flex">
                Browser Sandbox
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">
              Client-Side PII Sanitization
            </p>
          </div>
        </div>

        {/* Status & Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
            title="Zero network requests. Zero browser storage persistence. All processing stays in RAM."
          >
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            <Lock className="h-4 w-4 text-emerald-700" />
            <span>100% Local Processing</span>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-700 md:flex">
            <Cpu className="h-4 w-4 text-blue-700" />
            <span>In-Memory Only</span>
          </div>

          <button
            type="button"
            onClick={onReset}
            disabled={!hasContent}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
}
