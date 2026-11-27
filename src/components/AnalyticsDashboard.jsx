import {
  Activity,
  Mail,
  Phone,
  Globe,
  CreditCard,
  Fingerprint,
  FileBadge2,
  ShieldCheck,
  ScanLine,
} from 'lucide-react';
import { PII_META, PII_TYPES, REDACTION_MODE_OPTIONS } from '../engine/constants.js';

const CATEGORY_CARDS = [
  { type: PII_TYPES.EMAIL, title: 'Emails Detected', icon: Mail },
  { type: PII_TYPES.PHONE, title: 'Phone Numbers', icon: Phone },
  { type: PII_TYPES.IP_ADDRESS, title: 'IP Addresses', icon: Globe },
  { type: PII_TYPES.PAN, title: 'PAN Numbers', icon: FileBadge2 },
  { type: PII_TYPES.AADHAAR, title: 'Aadhaar Numbers', icon: Fingerprint },
  { type: PII_TYPES.CREDIT_CARD, title: 'Credit Cards', icon: CreditCard },
];

export default function AnalyticsDashboard({
  hasScanned,
  scannedText,
  redactedEntities,
  selectedMode,
}) {
  const counts = redactedEntities.reduce((acc, ent) => {
    acc[ent.type] = (acc[ent.type] || 0) + 1;
    return acc;
  }, {});

  const totalDetected = redactedEntities.length;
  const totalCharacters = hasScanned ? scannedText.length : 0;
  const modeLabel =
    REDACTION_MODE_OPTIONS.find((m) => m.id === selectedMode)?.title || selectedMode;

  const statusText = !hasScanned
    ? 'Awaiting Scan'
    : totalDetected > 0
      ? 'Sanitized & Protected'
      : 'Clean (No PII Found)';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Analytics &amp; Telemetry
            </h2>
            <p className="text-sm text-slate-500">
              Real-time local detection breakdown and sanitization summary
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${
            !hasScanned
              ? 'border-slate-200 bg-slate-100 text-slate-600'
              : 'border-emerald-300 bg-emerald-50 text-emerald-800'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>{statusText}</span>
        </span>
      </div>

      {/* Primary KPI + Summary Strip */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-blue-200 bg-blue-700 p-5 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-100">
              Total PII Detected
            </span>
            <ScanLine className="h-5 w-5 text-blue-200" />
          </div>
          <p className="mt-3 font-mono text-3xl font-extrabold text-white">
            {totalDetected}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <span className="text-sm font-semibold text-slate-500">
            Characters Scanned
          </span>
          <p className="mt-3 font-mono text-3xl font-extrabold text-slate-900">
            {totalCharacters.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <span className="text-sm font-semibold text-slate-500">
            Replacements Made
          </span>
          <p className="mt-3 font-mono text-3xl font-extrabold text-emerald-700">
            {totalDetected}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <span className="text-sm font-semibold text-slate-500">
            Sanitization Status
          </span>
          <p
            className={`mt-3 text-base font-bold ${
              hasScanned ? 'text-emerald-700' : 'text-slate-500'
            }`}
          >
            {statusText}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <span className="text-sm font-semibold text-slate-500">
            Active Redaction Mode
          </span>
          <p className="mt-3 text-base font-bold text-blue-700">{modeLabel}</p>
        </div>
      </div>

      {/* Per-Category Breakdown */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {CATEGORY_CARDS.map(({ type, title, icon: Icon }) => {
          const meta = PII_META[type];
          const count = counts[type] || 0;

          return (
            <div
              key={type}
              className={`rounded-xl border p-4 shadow-2xs ${meta.statAccent}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 sm:text-sm">
                  {title}
                </span>
                <Icon className="h-5 w-5 shrink-0" />
              </div>
              <p className="mt-3 font-mono text-2xl font-extrabold text-slate-900">
                {count}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
