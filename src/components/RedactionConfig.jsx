import { Sliders, ShieldAlert, EyeOff, KeyRound, ScanSearch } from 'lucide-react';
import { REDACTION_MODES, REDACTION_MODE_OPTIONS } from '../engine/constants.js';

const MODE_ICONS = {
  [REDACTION_MODES.FULL]: ShieldAlert,
  [REDACTION_MODES.PARTIAL]: EyeOff,
  [REDACTION_MODES.PSEUDONYM]: KeyRound,
};

export default function RedactionConfig({
  selectedMode,
  onSelectMode,
  onScan,
  hasScanned,
  entityCount,
}) {
  return (
    <section className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Redaction Mode
            </h2>
            <p className="text-sm text-slate-500">
              Choose how sensitive entities are sanitized
            </p>
          </div>
        </div>

        <div className="space-y-3" role="radiogroup" aria-label="Redaction Mode">
          {REDACTION_MODE_OPTIONS.map((option) => {
            const isSelected = selectedMode === option.id;
            const Icon = MODE_ICONS[option.id];

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelectMode(option.id)}
                className={`group w-full rounded-xl border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-blue-700 bg-blue-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-slate-900">
                          {option.title}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isSelected
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {option.subtitle}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected ? 'border-blue-700' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <span className="h-2.5 w-2.5 rounded-full bg-blue-700" />
                    )}
                  </span>
                </div>

                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs font-medium text-slate-800 sm:text-sm">
                  {option.example}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 pt-2">
        <button
          type="button"
          onClick={onScan}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-700 px-6 py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-blue-800 active:bg-blue-900"
        >
          <ScanSearch className="h-5 w-5" />
          <span>Scan &amp; Sanitize</span>
        </button>

        {hasScanned && (
          <p className="mt-2.5 text-center text-sm font-semibold text-emerald-700">
            Last scan complete • {entityCount} PII{' '}
            {entityCount === 1 ? 'entity' : 'entities'} processed locally
          </p>
        )}
      </div>
    </section>
  );
}
