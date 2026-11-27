import { useState } from 'react';
import {
  ClipboardList,
  Eye,
  EyeOff,
  Filter,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { PII_META } from '../engine/constants.js';
import { maskForAuditPreview } from '../engine/redactor.js';

export default function AuditTable({ hasScanned, redactedEntities }) {
  const [revealAll, setRevealAll] = useState(false);
  const [revealedRows, setRevealedRows] = useState({});
  const [typeFilter, setTypeFilter] = useState('ALL');

  const toggleRow = (id) => {
    setRevealedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredEntities =
    typeFilter === 'ALL'
      ? redactedEntities
      : redactedEntities.filter((e) => e.type === typeFilter);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              PII Audit Report
            </h2>
            <p className="text-sm text-slate-500">
              Original values remain masked by default for display safety
            </p>
          </div>
        </div>

        {redactedEntities.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter audit report by entity type"
                className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
              >
                <option value="ALL">
                  All Categories ({redactedEntities.length})
                </option>
                {Object.values(PII_META).map((meta) => (
                  <option key={meta.type} value={meta.type}>
                    {meta.shortLabel}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setRevealAll((prev) => !prev);
                setRevealedRows({});
              }}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                revealAll
                  ? 'border-amber-400 bg-amber-50 text-amber-900'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
              }`}
            >
              {revealAll ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>Mask Originals</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Reveal Originals</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {!hasScanned ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm font-medium text-slate-500">
          Run a scan to generate the entity-by-entity compliance audit report.
        </div>
      ) : filteredEntities.length === 0 ? (
        <div className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-12 text-sm font-medium text-slate-600">
          <ShieldAlert className="h-5 w-5 text-emerald-700" />
          <span>
            {redactedEntities.length === 0
              ? 'No PII entities were detected in the scanned input.'
              : 'No entities match the selected category filter.'}
          </span>
        </div>
      ) : (
        <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3.5">Entity Type</th>
                <th className="px-5 py-3.5">Detected Value</th>
                <th className="px-5 py-3.5">Redacted Value</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEntities.map((entity) => {
                const meta = PII_META[entity.type];
                const isRevealed = revealAll || Boolean(revealedRows[entity.id]);
                const displayedOriginal = isRevealed
                  ? entity.value
                  : maskForAuditPreview(entity.type, entity.value);

                return (
                  <tr
                    key={entity.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
                        {meta.shortLabel}
                      </span>
                      <div className="mt-1 text-xs text-slate-500">
                        {entity.confidence} • Pos {entity.start}–{entity.end}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            isRevealed
                              ? 'rounded-md bg-amber-100 px-2 py-0.5 font-semibold text-amber-950'
                              : 'text-slate-600'
                          }
                        >
                          {displayedOriginal}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleRow(entity.id)}
                          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                          title={isRevealed ? 'Mask original value' : 'Reveal original value'}
                          aria-label={
                            isRevealed ? 'Mask original value' : 'Reveal original value'
                          }
                        >
                          {isRevealed ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-sm font-semibold text-emerald-800">
                      <span className="rounded-md bg-emerald-50 px-2.5 py-1 ring-1 ring-emerald-200">
                        {entity.redactedValue}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {entity.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
