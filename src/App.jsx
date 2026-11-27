import { useCallback, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Header from './components/Header.jsx';
import InputSection from './components/InputSection.jsx';
import RedactionConfig from './components/RedactionConfig.jsx';
import ComparisonView from './components/ComparisonView.jsx';
import AnalyticsDashboard from './components/AnalyticsDashboard.jsx';
import AuditTable from './components/AuditTable.jsx';
import ActivityLog from './components/ActivityLog.jsx';

import {
  REDACTION_MODES,
  REDACTION_MODE_OPTIONS,
  SAMPLE_NOISY_TEXT,
} from './engine/constants.js';
import { detectPII } from './engine/detector.js';
import { createPseudonymStore, redactText } from './engine/redactor.js';
import { detectPIIInCSV } from './engine/csvHandler.js';

function formatTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getModeTitle(mode) {
  return REDACTION_MODE_OPTIONS.find((m) => m.id === mode)?.title || mode;
}

function createInitialLogs() {
  return [
    {
      id: `log_${Date.now()}_init`,
      timestamp: formatTimestamp(),
      tag: 'INIT',
      level: 'success',
      message:
        'Detection engine initialized (6 local PII detectors + Luhn/Verhoeff validators ready).',
    },
  ];
}

export default function App() {
  const [inputText, setInputText] = useState('');
  const [selectedMode, setSelectedMode] = useState(REDACTION_MODES.PSEUDONYM);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [csvMeta, setCsvMeta] = useState(null);
  const [error, setError] = useState('');

  const [hasScanned, setHasScanned] = useState(false);
  const [scannedText, setScannedText] = useState('');
  const [detectedEntities, setDetectedEntities] = useState([]);
  const [redactedEntities, setRedactedEntities] = useState([]);
  const [sanitizedText, setSanitizedText] = useState('');
  const [toast, setToast] = useState('');

  const [logs, setLogs] = useState(createInitialLogs);
  const pseudonymStoreRef = useRef(createPseudonymStore());
  const logCounterRef = useRef(1);

  const appendLog = useCallback((tag, message, level = 'info') => {
    logCounterRef.current += 1;
    const entry = {
      id: `log_${Date.now()}_${logCounterRef.current}`,
      timestamp: formatTimestamp(),
      tag,
      level,
      message,
    };
    setLogs((prev) => [entry, ...prev]);
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast((current) => (current === msg ? '' : current));
    }, 3200);
  }, []);

  const handleTextChange = (value) => {
    setInputText(value);
    if (error) setError('');
    if (uploadedFile && value !== uploadedFile.content) {
      // If user edits pasted/loaded CSV heavily, keep format info accurate
      if (uploadedFile.type === 'csv') {
        setCsvMeta(null);
      }
    }
  };

  const handleLoadSample = () => {
    pseudonymStoreRef.current = createPseudonymStore();
    setUploadedFile(null);
    setCsvMeta(null);
    setError('');
    setInputText(SAMPLE_NOISY_TEXT);
    setHasScanned(false);
    setDetectedEntities([]);
    setRedactedEntities([]);
    setSanitizedText('');
    setScannedText('');
    appendLog(
      'SAMPLE',
      `Sample noisy dataset loaded (${SAMPLE_NOISY_TEXT.length} chars across all 6 PII categories).`,
      'info'
    );
  };

  const handleFileLoaded = (fileData) => {
    pseudonymStoreRef.current = createPseudonymStore();
    setError('');
    setUploadedFile(fileData);
    setInputText(fileData.content);
    setHasScanned(false);
    setDetectedEntities([]);
    setRedactedEntities([]);
    setSanitizedText('');
    setScannedText('');

    if (fileData.type === 'csv') {
      const { meta } = detectPIIInCSV(fileData.content);
      setCsvMeta(meta);
      appendLog(
        'UPLOAD',
        `File uploaded: ${fileData.name} (${(fileData.size / 1024).toFixed(1)} KB, CSV ${meta.rowCount}×${meta.columnCount}).`,
        'info'
      );
    } else {
      setCsvMeta(null);
      appendLog(
        'UPLOAD',
        `File uploaded: ${fileData.name} (${(fileData.size / 1024).toFixed(1)} KB, TXT).`,
        'info'
      );
    }
  };

  const handleFileError = (msg) => {
    setError(msg);
    appendLog('ERROR', msg, 'warning');
  };

  const runScanAndSanitize = (modeToUse = selectedMode) => {
    if (!inputText || !inputText.trim()) {
      const msg = 'Input is empty. Paste sensitive text or upload a .txt / .csv file first.';
      setError(msg);
      appendLog('ERROR', 'Scan aborted: input text is empty.', 'warning');
      return;
    }

    try {
      setError('');
      appendLog('SCAN', 'PII scanning started locally in browser memory.', 'info');

      const isCsv = uploadedFile?.type === 'csv';
      let entities = [];
      let nextCsvMeta = null;

      if (isCsv) {
        const csvResult = detectPIIInCSV(inputText);
        entities = csvResult.entities;
        nextCsvMeta = csvResult.meta;
        setCsvMeta(nextCsvMeta);
      } else {
        entities = detectPII(inputText);
      }

      // Reset pseudonym store for a fresh scan so numbering starts cleanly from _01
      const freshStore = createPseudonymStore();
      pseudonymStoreRef.current = freshStore;

      const {
        sanitizedText: output,
        redactedEntities: redacted,
      } = redactText(inputText, entities, modeToUse, freshStore);

      setScannedText(inputText);
      setDetectedEntities(entities);
      setRedactedEntities(redacted);
      setSanitizedText(output);
      setHasScanned(true);

      const distinctCategories = new Set(entities.map((e) => e.type)).size;
      appendLog(
        'DETECT',
        `Detected ${entities.length} PII ${entities.length === 1 ? 'entity' : 'entities'} across ${distinctCategories} ${distinctCategories === 1 ? 'category' : 'categories'}.`,
        entities.length > 0 ? 'info' : 'success'
      );
      appendLog(
        'MODE',
        `Selected redaction mode: ${getModeTitle(modeToUse)}.`,
        'info'
      );
      appendLog(
        'DONE',
        `Sanitization completed (${redacted.length} replacements applied, 0 bytes sent externally).`,
        'success'
      );
    } catch {
      const msg = 'An unexpected error occurred while processing the document.';
      setError(msg);
      appendLog('ERROR', msg, 'warning');
    }
  };

  const handleSelectMode = (mode) => {
    setSelectedMode(mode);
    if (hasScanned && scannedText) {
      const freshStore = createPseudonymStore();
      pseudonymStoreRef.current = freshStore;
      const { sanitizedText: output, redactedEntities: redacted } = redactText(
        scannedText,
        detectedEntities,
        mode,
        freshStore
      );
      setRedactedEntities(redacted);
      setSanitizedText(output);
      appendLog(
        'MODE',
        `Selected redaction mode switched to ${getModeTitle(mode)} — output updated.`,
        'info'
      );
    }
  };

  const handleClearText = () => {
    pseudonymStoreRef.current = createPseudonymStore();
    setInputText('');
    setUploadedFile(null);
    setCsvMeta(null);
    setError('');
    setHasScanned(false);
    setScannedText('');
    setDetectedEntities([]);
    setRedactedEntities([]);
    setSanitizedText('');
    appendLog('CLEAR', 'Input editor and in-memory pseudonym mappings cleared.', 'info');
  };

  const handleResetAll = () => {
    pseudonymStoreRef.current = createPseudonymStore();
    setInputText('');
    setSelectedMode(REDACTION_MODES.PSEUDONYM);
    setUploadedFile(null);
    setCsvMeta(null);
    setError('');
    setHasScanned(false);
    setScannedText('');
    setDetectedEntities([]);
    setRedactedEntities([]);
    setSanitizedText('');
    setLogs([
      ...createInitialLogs(),
      {
        id: `log_${Date.now()}_reset`,
        timestamp: formatTimestamp(),
        tag: 'RESET',
        level: 'info',
        message: 'Workspace reset — input, audit data, and pseudonym mappings cleared.',
      },
    ]);
  };

  const handleCopySanitized = async () => {
    if (!sanitizedText) return false;
    try {
      await navigator.clipboard.writeText(sanitizedText);
      appendLog('COPY', 'Sanitized output copied to local clipboard.', 'success');
      showToast('Sanitized output copied to clipboard');
      return true;
    } catch {
      setError('Clipboard access was denied by browser permissions.');
      return false;
    }
  };

  const handleDownload = (format) => {
    if (!hasScanned) return;

    const ext = format === 'csv' ? 'csv' : 'txt';
    const mimeType =
      ext === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8';
    const baseName = uploadedFile?.name
      ? uploadedFile.name.replace(/\.(txt|csv)$/i, '')
      : 'sanitized-output';
    const downloadName = `${baseName}_sanitized.${ext}`;

    const blob = new Blob([sanitizedText], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = downloadName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 100);

    appendLog('EXPORT', `File downloaded: ${downloadName}`, 'success');
    showToast(`Downloaded ${downloadName}`);
  };

  const hasContent = Boolean(inputText || hasScanned || uploadedFile);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header onReset={handleResetAll} hasContent={hasContent} />

      {/* Export / Clipboard Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-800 px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          <CheckCircle2 className="h-5 w-5 text-emerald-200" />
          <span>{toast}</span>
        </div>
      )}

      <main className="mx-auto max-w-[1600px] space-y-8 px-5 py-8 sm:px-8 lg:px-10">
        {/* Top Workspace: Input + Redaction Config */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 xl:col-span-8">
            <InputSection
              inputText={inputText}
              onTextChange={handleTextChange}
              onClear={handleClearText}
              onLoadSample={handleLoadSample}
              onFileLoaded={handleFileLoaded}
              uploadedFile={uploadedFile}
              csvMeta={csvMeta}
              error={error}
              onDismissError={() => setError('')}
              onFileError={handleFileError}
            />
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <RedactionConfig
              selectedMode={selectedMode}
              onSelectMode={handleSelectMode}
              onScan={() => runScanAndSanitize(selectedMode)}
              hasScanned={hasScanned}
              entityCount={redactedEntities.length}
            />
          </div>
        </div>

        {/* Side-by-Side Comparison */}
        <ComparisonView
          hasScanned={hasScanned}
          scannedText={scannedText}
          sanitizedText={sanitizedText}
          redactedEntities={redactedEntities}
          isCsvSource={uploadedFile?.type === 'csv'}
          onCopy={handleCopySanitized}
          onDownload={handleDownload}
          onLoadSample={handleLoadSample}
        />

        {/* Analytics Dashboard */}
        <AnalyticsDashboard
          hasScanned={hasScanned}
          scannedText={scannedText}
          redactedEntities={redactedEntities}
          selectedMode={selectedMode}
        />

        {/* Audit Table & Local Activity Log */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <AuditTable
              hasScanned={hasScanned}
              redactedEntities={redactedEntities}
            />
          </div>
          <div className="xl:col-span-5">
            <ActivityLog logs={logs} />
          </div>
        </div>
      </main>
    </div>
  );
}
