import { useRef, useState } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  Sparkles,
  AlertCircle,
  FileSpreadsheet,
  X,
} from 'lucide-react';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB client-side guard

export default function InputSection({
  inputText,
  onTextChange,
  onClear,
  onLoadSample,
  onFileLoaded,
  uploadedFile,
  csvMeta,
  error,
  onDismissError,
  onFileError,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file) => {
    if (!file) return;

    const fileName = file.name || 'document';
    const lowerName = fileName.toLowerCase();
    const isTxt = lowerName.endsWith('.txt');
    const isCsv = lowerName.endsWith('.csv');

    if (!isTxt && !isCsv) {
      onFileError(
        `Unsupported file "${fileName}". Please upload a .txt or .csv file only.`
      );
      return;
    }

    if (file.size === 0) {
      onFileError(`The uploaded file "${fileName}" is empty.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onFileError(
        `File "${fileName}" exceeds the 5 MB browser processing limit.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== 'string') {
        onFileError('Could not read file contents as plain text.');
        return;
      }
      if (!content.trim()) {
        onFileError(`File "${fileName}" contains only whitespace.`);
        return;
      }
      onFileLoaded({
        name: fileName,
        size: file.size,
        type: isCsv ? 'csv' : 'txt',
        content,
      });
    };
    reader.onerror = () => {
      onFileError(`Failed to read "${fileName}" from local disk.`);
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const lineCount = inputText ? inputText.split(/\r?\n/).length : 0;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-200">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Source Input Data
            </h2>
            <p className="text-sm text-slate-500">
              Paste raw text or upload a{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                .txt
              </code>{' '}
              or{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                .csv
              </code>{' '}
              file
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-100"
          >
            <Sparkles className="h-4 w-4 text-blue-700" />
            <span>Load Sample Data</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-800"
          >
            <Upload className="h-4 w-4" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={!inputText && !uploadedFile}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Text</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,text/plain,text/csv"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Uploaded file metadata pill */}
      {uploadedFile && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2.5 text-sm">
          <div className="flex flex-wrap items-center gap-2.5 text-slate-800">
            {uploadedFile.type === 'csv' ? (
              <FileSpreadsheet className="h-5 w-5 text-emerald-700" />
            ) : (
              <FileText className="h-5 w-5 text-blue-700" />
            )}
            <span className="font-bold">{uploadedFile.name}</span>
            <span className="text-slate-500">
              ({(uploadedFile.size / 1024).toFixed(1)} KB)
            </span>
            {uploadedFile.type === 'csv' && csvMeta && (
              <span className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                CSV Structure: {csvMeta.rowCount} rows × {csvMeta.columnCount} cols
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-emerald-700">
            Loaded locally via File API
          </span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            className="rounded-lg p-1 text-red-700 hover:bg-red-100"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Drag & Drop Textarea Wrapper */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex-1 rounded-xl border-2 transition-colors ${
          isDragging
            ? 'border-blue-600 bg-blue-50/70'
            : 'border-slate-200 bg-slate-50/60 focus-within:border-blue-600 focus-within:bg-white'
        }`}
      >
        <textarea
          value={inputText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Paste your sensitive text here…"
          spellCheck={false}
          rows={12}
          className="h-full min-h-[340px] w-full resize-y rounded-xl bg-transparent p-5 font-mono text-sm leading-7 text-slate-900 placeholder-slate-400 focus:outline-none sm:text-[15px]"
        />

        {isDragging && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-white/90 backdrop-blur-xs">
            <Upload className="mb-3 h-10 w-10 text-blue-700" />
            <p className="text-base font-bold text-blue-900">
              Drop your .txt or .csv file to load locally
            </p>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500 sm:text-sm">
        <span>Supported formats: TXT and CSV (quoted &amp; multiline fields preserved)</span>
        <div className="flex items-center gap-3 font-mono text-slate-700">
          <span>{lineCount.toLocaleString()} lines</span>
          <span className="text-slate-300">•</span>
          <span className="font-semibold">
            {inputText.length.toLocaleString()} characters
          </span>
        </div>
      </div>
    </section>
  );
}
