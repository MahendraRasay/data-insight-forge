import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createRoot } from "react-dom/client";
import DashboardPage from "../pages/DashboardPage";

const REPORT_SECTIONS = [
  { tab: "overview", title: "Overview" },
  { tab: "distributions", title: "Distributions" },
  { tab: "correlation", title: "Correlation" },
];
const PREVIEW_ROWS_PER_PAGE = 16;

function chunkRows(rows, size) {
  const chunks = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

function buildReportPages(analysis) {
  const sampleRows = Array.isArray(analysis?.sample_rows) ? analysis.sample_rows : [];
  const previewChunks = sampleRows.length > 0 ? chunkRows(sampleRows, PREVIEW_ROWS_PER_PAGE) : [[]];
  const previewTotalPages = previewChunks.length;

  return [
    {
      kind: "cover",
      title: "InsightForge Report",
      subtitle: analysis?.filename || "Dataset",
    },
    ...REPORT_SECTIONS.map((section) => ({
      kind: "dashboard",
      tab: section.tab,
      title: section.title,
      subtitle: "Mirrors dashboard visuals",
    })),
    ...previewChunks.map((rows, index) => ({
      kind: "dashboard",
      tab: "preview",
      title: `Data Preview ${index + 1}/${previewTotalPages}`,
      subtitle: `Rows ${index * PREVIEW_ROWS_PER_PAGE + 1}-${index * PREVIEW_ROWS_PER_PAGE + rows.length}`,
      previewRows: rows,
    })),
  ];
}

function waitForNextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

async function waitForImages(container) {
  const images = Array.from(container.querySelectorAll("img"));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );
}

async function waitForStableRender(container) {
  await waitForNextPaint();
  await waitForImages(container);
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await waitForNextPaint();
}

export async function downloadDashboardPdf(analysis, filename = "ai_data_insight_report.pdf") {
  const reportPages = buildReportPages(analysis);
  const host = document.createElement("div");
  host.className = "pdf-render-host";
  document.body.appendChild(host);

  const root = createRoot(host);

  try {
    root.render(
      <div className="pdf-render-root">
        {reportPages.map((page, index) => {
          if (page.kind === "cover") {
            return (
              <section key={`cover-${index}`} className="pdf-render-page pdf-cover-page">
                <p className="pdf-cover-kicker">InsightForge</p>
                <h1>{page.title}</h1>
                <p className="pdf-cover-subtitle">{page.subtitle}</p>
                <p className="pdf-cover-meta">Generated {new Date().toLocaleString()}</p>
              </section>
            );
          }

          return (
            <section key={`${page.tab}-${index}`} className="pdf-render-page">
              <div className="pdf-page-banner">
                <h2>{page.title}</h2>
                <p>{page.subtitle}</p>
              </div>
              <DashboardPage
                analysis={analysis}
                onDownload={() => {}}
                forcedTab={page.tab}
                reportMode
                showTabs={false}
                showDownloadButton={false}
                previewRows={page.previewRows}
              />
            </section>
          );
        })}
      </div>
    );

    await waitForStableRender(host);

    const pages = Array.from(host.querySelectorAll(".pdf-render-page"));
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 18;

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const canvas = await html2canvas(page, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1366,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
      const renderWidth = canvas.width * ratio;
      const renderHeight = canvas.height * ratio;
      const x = (pageWidth - renderWidth) / 2;
      const y = (pageHeight - renderHeight) / 2;

      if (index > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, "JPEG", x, y, renderWidth, renderHeight, undefined, "FAST");
    }

    pdf.save(filename);
  } finally {
    root.unmount();
    host.remove();
  }
}
