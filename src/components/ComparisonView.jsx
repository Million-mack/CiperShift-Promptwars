import { useRef, useState } from 'react';
import {
  Columns2,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Link2,
  FileSearch,
  Sparkles,
} from 'lucide-react';
import { PII_META } from '../engine/constants.js';

function renderHighlightedSegments(text, entities, mode) {
  if (!text) return null;
  if (!entities || entities.length === 0) {
    return <span>{text}</span>;
  }

  const segments = [];
  let cursor = 0;

  for (const entity of entities) {
    const start = mode === 'original' ? entity.start : entity.sanitizedStart;
    const end = mode === 'original' ? entity.end : entity.sanitizedEnd;
    const meta = PII_META[entity.type];

    if (start > cursor) {
      segments.push(
        <span key={`plain-${cursor}`}>{text.slice(cursor, start)}</span>
      );
    }

    const displayToken = text.slice(start, end);

    segments.push(
      <span
        key={`${mode}-${entity.id}`}
        className={`group relative inline-block cursor-help rounded-sm px-1.5 py-0.5 font-semibold transition-colors ${
          mode === 'original'
            ? meta.highlightClass
            : 'border-b-2 border-emerald-600 bg-emerald-100 text-emerald-950'
        }`}
        tabIndex={0}
      >
        {displayToken}
        {/* Accessible Hover / Focus Tooltip */}
        <span className="pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100">
          <span className="inline-flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClass}`} />
            <span>{meta.label}</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-300">
              {mode === 'original' ? entity.confidence : entity.status}
            </span>
          </span>
        </span>
      </span>
    );

    cursor = end;
  }

  if (cursor < text.length) {
    segments.push(<span key={`plain-end-${cursor}`}>{text.slice(cursor)}</span>);
  }

  return segments;
}

export default function ComparisonView({
  hasScanned,
  scannedText,
  sanitizedText,
  redactedEntities,
  isCsvSource,
  onCopy,
  onDownload,
  onLoadSample,
}) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const syncingRef = useRef(false);
  const [syncScroll, setSyncScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleScroll = (source) => {
    if (!syncScroll || syncingRef.current) return;
    const fromEl = source === 'left' ? leftRef.current : rightRef.current;
    const toEl = source === 'left' ? rightRef.current : leftRef.current;
    if (!fromEl || !toEl) return;

    syncingRef.current = true;
    const maxFrom = fromEl.scrollHeight - fromEl.clientHeight;
    const maxTo = toEl.scrollHeight - toEl.clientHeight;
    if (maxFrom > 0 && maxTo > 0) {
      toEl.scrollTop = (fromEl.scrollTop / maxFrom) * maxTo;
    } else {
      toEl.scrollTop = fromEl.scrollTop;
    }
    requestAnimationFrame(() => {
      syncingRef.current = false;
    });
  };

  const handleCopyClick = async () => {
    const ok = await onCopy();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header Row */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200">
            <Columns2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Side-by-Side Comparison
            </h2>
            <p className="text-sm text-slate-500">
              Inspect highlighted PII detections alongside the sanitized output
            </p>
          </div>
        </div>

        {hasScanned && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSyncScroll((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
                syncScroll
                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                  : 'border-slate-300 bg-white text-slate-600'
              }`}
            >
              <Link2 className="h-4 w-4" />
              <span>Sync Scroll {syncScroll ? 'On' : 'Off'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyClick}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-700" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-blue-700" />
                  <span>Copy Sanitized Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onDownload(isCsvSource ? 'csv' : 'txt')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-emerald-800"
            >
              <Download className="h-4 w-4" />
              <span>Download {isCsvSource ? '.csv' : '.txt'}</span>
            </button>

            {isCsvSource && (
              <button
                type="button"
                onClick={() => onDownload('txt')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
                <span>.txt</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category Color Legend */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-600">
          Legend:
        </span>
        {Object.values(PII_META).map((meta) => (
          <span
            key={meta.type}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${meta.dotClass}`} />
            <span>{meta.shortLabel}</span>
          </span>
        ))}
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          <span>Sanitized Token</span>
        </span>
      </div>

      {/* Empty State vs Dual Panels */}
      {!hasScanned ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <FileSearch className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Ready to Inspect &amp; Redact Sensitive Data
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Paste confidential logs, support tickets, or upload a{' '}
            <code className="rounded bg-slate-200 px-1.5 py-0.5 font-semibold text-blue-800">
              .txt
            </code>{' '}
            /{' '}
            <code className="rounded bg-slate-200 px-1.5 py-0.5 font-semibold text-blue-800">
              .csv
            </code>{' '}
            file above, choose a redaction mode, and click{' '}
            <strong className="text-slate-900">Scan &amp; Sanitize</strong>.
          </p>
          <button
            type="button"
            onClick={onLoadSample}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            <Sparkles className="h-4 w-4" />
            <span>Try with Sample Data</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* LEFT PANEL: Original Text */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-300 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-sm font-bold text-slate-900">
                  Original Text (Highlighted PII)
                </span>
              </div>
              <span className="rounded-md bg-white px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                {redactedEntities.length} flagged
              </span>
            </div>
            <div
              ref={leftRef}
              onScroll={() => handleScroll('left')}
              className="h-[440px] overflow-y-auto bg-slate-50/40 p-5 font-mono text-sm leading-7 text-slate-900 whitespace-pre-wrap break-words sm:text-[15px]"
            >
              {renderHighlightedSegments(scannedText, redactedEntities, 'original')}
            </div>
          </div>

          {/* RIGHT PANEL: Sanitized Output */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-emerald-300 bg-white">
            <div className="flex items-center justify-between border-b border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-700" />
                <span className="text-sm font-bold text-emerald-950">
                  Sanitized Output
                </span>
              </div>
              <span className="rounded-md bg-white px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                Safe to share
              </span>
            </div>
            <div
              ref={rightRef}
              onScroll={() => handleScroll('right')}
              className="h-[440px] overflow-y-auto bg-white p-5 font-mono text-sm leading-7 text-slate-900 whitespace-pre-wrap break-words sm:text-[15px]"
            >
              {renderHighlightedSegments(sanitizedText, redactedEntities, 'sanitized')}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
