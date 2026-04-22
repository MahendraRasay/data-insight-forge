import { useEffect, useRef, useState } from "react";

function UploadPanel({ onUpload, loading }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [localError, setLocalError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  const LOADING_LABELS = ["Uploading...", "Processing...", "Generating Insights..."];
  const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }

    // Cycle through loading messages to signal progress while analysis runs server-side.
    const timer = setInterval(() => {
      setLoadingStep((prevStep) => (prevStep + 1) % LOADING_LABELS.length);
    }, 1400);

    return () => clearInterval(timer);
  }, [loading]);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isCsvFile = (file) => {
    if (!file) return false;
    const nameIsCsv = file.name.toLowerCase().endsWith(".csv");
    const typeIsCsv = file.type === "text/csv" || file.type === "application/vnd.ms-excel";
    return nameIsCsv || typeIsCsv;
  };

  const setFileIfValid = (file) => {
    if (!file) return;

    if (!isCsvFile(file)) {
      setLocalError("Only CSV files are allowed.");
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError("File is too large. Maximum size is 500MB.");
      setSelectedFile(null);
      return;
    }

    setLocalError("");
    setSelectedFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const file = selectedFile || inputRef.current?.files?.[0];
    if (!file) return;
    await onUpload(file);
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    setFileIfValid(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer?.files?.[0];
    setFileIfValid(file);

    if (inputRef.current) {
      const transfer = new DataTransfer();
      if (file) transfer.items.add(file);
      inputRef.current.files = transfer.files;
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setLocalError("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const openFilePicker = () => {
    if (!loading) {
      inputRef.current?.click();
    }
  };

  return (
    <section className="panel panel-upload">
      <div className="upload-header">
        <div className="upload-hero-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="presentation" focusable="false">
            <path d="M6.5 20.5h11A3.5 3.5 0 0 0 21 17a3.48 3.48 0 0 0-1.64-2.95A5.5 5.5 0 0 0 8.7 9.96 4 4 0 0 0 6.5 17.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 17V9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="m8.8 12.2 3.2-3.2 3.2 3.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h2>Upload Dataset</h2>
          <p>Drop your CSV to generate EDA metrics, charts, and ML-backed insights in one flow.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleInputChange} className="upload-native-input" />

        <div
          className={`upload-dropzone${isDragActive ? " is-drag-active" : ""}${selectedFile ? " has-file" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFilePicker}
          role="button"
          tabIndex={loading ? -1 : 0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFilePicker();
            }
          }}
          aria-label="Drag and drop CSV file here or open file picker"
        >
          <p className="upload-dropzone-title">Drag & Drop your file</p>
          <p className="upload-dropzone-subtitle">or click to Upload CSV</p>
        </div>

        {selectedFile && (
          <div className="upload-file-feedback" aria-live="polite">
            <div>
              <p className="upload-file-name" title={selectedFile.name}>{selectedFile.name}</p>
              <p className="upload-file-meta">{formatFileSize(selectedFile.size)} • Ready to analyze</p>
            </div>
            <div className="upload-file-actions">
              <button type="button" className="upload-secondary-btn" onClick={openFilePicker} disabled={loading}>
                Change
              </button>
              <button type="button" className="upload-secondary-btn" onClick={handleRemoveFile} disabled={loading}>
                Remove
              </button>
            </div>
          </div>
        )}

        {localError && <p className="upload-error">{localError}</p>}

        <div className="upload-helper-row">
          <span>Supported: CSV files</span>
          <span>Max size: 500MB</span>
        </div>

        <button type="submit" disabled={loading || !selectedFile || Boolean(localError)} className="upload-submit-btn">
          {loading && <span className="upload-spinner" aria-hidden="true" />}
          <span>{loading ? LOADING_LABELS[loadingStep] : "Analyze Dataset"}</span>
        </button>
      </form>
    </section>
  );
}

export default UploadPanel;
