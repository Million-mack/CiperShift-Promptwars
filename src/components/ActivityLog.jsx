import { Terminal, ShieldCheck } from 'lucide-react';

const LEVEL_STYLES = {
  info: 'text-blue-800 border-blue-200 bg-blue-50',
  success: 'text-emerald-800 border-emerald-200 bg-emerald-50',
  warning: 'text-amber-900 border-amber-300 bg-amber-50',
};

export default function ActivityLog({ logs }) {
  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Prompt &amp; Activity Log
            </h2>
            <p className="text-sm text-slate-500">
              Local execution events (zero PII values logged)
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          <span>PII-Free</span>
        </span>
      </div>

      <div className="max-h-[420px] flex-1 space-y-2.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3.5 font-mono text-xs sm:text-sm">
        {logs.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs"
          >
            <span className="shrink-0 text-xs font-medium text-slate-500">
              [{entry.timestamp}]
            </span>
            <span
              className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase ${
                LEVEL_STYLES[entry.level] || LEVEL_STYLES.info
              }`}
            >
              {entry.tag}
            </span>
            <span className="leading-relaxed text-slate-800">{entry.message}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
