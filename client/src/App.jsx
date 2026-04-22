import { useState } from "react";
import { uploadCsv } from "./api";
import UploadPanel from "./components/UploadPanel";
import DashboardPage from "./pages/DashboardPage";
import { downloadDashboardPdf } from "./utils/dashboardPdf.jsx";

function App() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (file) => {
    setLoading(true);
    setError("");

    try {
      const result = await uploadCsv(file);
      setAnalysis(result);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to analyze dataset.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!analysis) return;

    try {
      await downloadDashboardPdf(
        analysis,
        `${analysis.filename?.replace(".csv", "") || "dataset"}_insight_report.pdf`
      );
    } catch (err) {
      setError(err.message || "Failed to download report.");
    }
  };

  return (
    <main className="app-shell">
      <UploadPanel onUpload={handleUpload} loading={loading} />
      {error && <p className="error-banner">{error}</p>}
      <DashboardPage analysis={analysis} onDownload={handleDownload} />
    </main>
  );
}

export default App;
