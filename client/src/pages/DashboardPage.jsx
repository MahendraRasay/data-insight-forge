import { useState } from "react";
import ChartsPanel from "../components/ChartsPanel";
import SummaryCards from "../components/SummaryCards";
import DataPreviewTable from "../components/DataPreviewTable";
import SummaryStatsCompact from "../components/SummaryStatsCompact";
import { Activity, BarChart3, Table2, TrendingUp } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "distributions", label: "Distributions", icon: Activity },
  { id: "correlation", label: "Correlation", icon: TrendingUp },
  { id: "preview", label: "Data Preview", icon: Table2 },
];

function buildMissingRows(missingValues = {}, missingPercentages = {}) {
  return Object.entries(missingValues)
    .map(([column, count]) => {
      const percentage = missingPercentages?.[column] ?? 0;
      const colorClass = percentage < 5 ? "quality-pill-green" : percentage < 20 ? "quality-pill-yellow" : "quality-pill-red";

      return {
        column,
        count,
        percentage,
        colorClass,
      };
    })
    .sort((left, right) => right.percentage - left.percentage || right.count - left.count);
}

function buildChartSet(charts, activeTab) {
  const entries = Object.entries(charts || {});

  if (activeTab === "distributions") {
    return Object.fromEntries(entries.filter(([key]) => key === "histograms" || key === "boxplots"));
  }

  if (activeTab === "correlation") {
    return Object.fromEntries(entries.filter(([key]) => key === "correlation_heatmap"));
  }

  return {};
}

function DashboardPage({
  analysis,
  onDownload,
  forcedTab = null,
  reportMode = false,
  showTabs = true,
  showDownloadButton = true,
  previewRows = null,
}) {
  const [activeTabState, setActiveTabState] = useState("overview");
  const activeTab = forcedTab || activeTabState;
  const setActiveTab = forcedTab ? () => {} : setActiveTabState;

  if (!analysis) return null;

  const missingRows = buildMissingRows(analysis.missing_values, analysis.missing_percentages);
  const chartSet = buildChartSet(analysis.charts, activeTab);
  const dataTypeEntries = Object.entries(analysis.dtypes || {});
  const duplicateCount = Number(analysis.duplicate_count ?? 0);
  const totalMissingCells = missingRows.reduce((sum, row) => sum + Number(row.count || 0), 0);
  const worstMissing = missingRows[0];

  return (
    <section className={`dashboard dashboard-shell${reportMode ? " dashboard-report-mode" : ""}`}>
      <header className="dashboard-header dashboard-header-compact">
        <div className="dashboard-titleblock">
          <p className="dashboard-kicker">EDA Overview</p>
          <h1>EDA Dashboard</h1>
          <p className="dashboard-subtitle">A compact workspace for quality checks, distributions, correlation, and previewing records.</p>
        </div>

        {showTabs && (
          <nav className="dashboard-tabs" aria-label="Dashboard sections">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`dashboard-tab ${activeTab === id ? "dashboard-tab-active" : ""}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        )}

        {showDownloadButton && (
          <div className="dashboard-actions">
            <button onClick={onDownload}>Download PDF Report</button>
          </div>
        )}
      </header>

      <SummaryCards overview={analysis.overview} dtypes={analysis.dtypes} />

      <div className="dashboard-grid">
        {activeTab === "overview" && (
          <>
            <div className="dashboard-span-12 quality-overview-section">
              <div className="section-heading quality-overview-heading">
                <div>
                  <h2>Data Quality Overview</h2>
                  <p className="section-subtitle">Summary statistics and missingness are grouped for quicker quality assessment.</p>
                </div>
              </div>

              <div className="quality-overview-grid">
                <div className="quality-overview-column">
                  <SummaryStatsCompact summary={analysis.summary_stats} />
                </div>

                <div className="quality-overview-column">
                  <section className="panel missing-values-panel">
                    <div className="section-heading">
                      <div>
                        <h2>Missing Values Analysis</h2>
                        <p className="section-subtitle">Columns with missing data</p>
                      </div>
                      <span className="quality-pill quality-pill-blue">Data quality</span>
                    </div>

                    {missingRows.length === 0 ? (
                      <p>No missing values detected.</p>
                    ) : (
                      <div className="missing-values-layout">
                        <div className="missing-metrics-grid">
                          <article className="summary-card missing-metric-card">
                            <h3>Columns with Missing Data</h3>
                            <p>{missingRows.length}</p>
                          </article>
                          <article className="summary-card missing-metric-card">
                            <h3>Total Missing Cells</h3>
                            <p>{totalMissingCells}</p>
                          </article>
                          <article className="summary-card missing-metric-card">
                            <h3>Worst Column</h3>
                            <p>{worstMissing ? `${worstMissing.percentage}%` : "-"}</p>
                          </article>
                        </div>

                        <div className="table-scroll missing-table-scroll">
                          <table className="data-table missing-table">
                            <thead>
                              <tr>
                                <th>Column</th>
                                <th>Missing Count</th>
                                <th>Missing %</th>
                                <th>Severity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {missingRows.map((row, index) => (
                                <tr key={row.column} className={index % 2 === 0 ? "table-row-even" : "table-row-odd"}>
                                  <td className="summary-column-cell">{row.column}</td>
                                  <td>{row.count}</td>
                                  <td>{row.percentage}%</td>
                                  <td>
                                    <div className="missing-severity-cell">
                                      <span className={`quality-pill ${row.colorClass}`}>
                                        {row.percentage < 5 ? "Low" : row.percentage < 20 ? "Moderate" : "High"}
                                      </span>
                                      <div className="quality-summary-bar missing-mini-bar">
                                        <div
                                          className={`quality-summary-fill ${row.colorClass}`}
                                          style={{ width: `${Math.min(row.percentage, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="missing-legend">
                          <span className="quality-pill quality-pill-green">0-5% low</span>
                          <span className="quality-pill quality-pill-yellow">5-20% moderate</span>
                          <span className="quality-pill quality-pill-red">20%+ high</span>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>

            <div className="dashboard-span-12">
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <h2>Data Types & Duplicates</h2>
                    <p className="section-subtitle">A compact structural snapshot of the uploaded dataset.</p>
                  </div>
                  <span className={`quality-pill ${duplicateCount > 0 ? "quality-pill-yellow" : "quality-pill-green"}`}>
                    {duplicateCount} duplicates
                  </span>
                </div>

                <div className="data-compact-grid">
                  <div className="compact-card">
                    <div className="compact-card-title">Duplicate Rows</div>
                    <div className={`compact-card-value ${duplicateCount > 0 ? "text-warning" : "text-success"}`}>{duplicateCount}</div>
                    <div className="compact-card-note">Detected from uploaded file</div>
                  </div>

                  <div className="compact-card compact-card-wide">
                    <div className="compact-card-title">Data Types</div>
                    <div className="data-type-inline-list">
                      {dataTypeEntries.slice(0, 8).map(([column, dtype]) => (
                        <div key={column} className="data-type-inline-row">
                          <span>{column}</span>
                          <strong>{dtype}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </>
        )}

        {activeTab === "distributions" && (
          <div className="dashboard-span-12">
            <div className="section-heading">
              <div>
                <h2>Distributions</h2>
                <p className="section-subtitle">Histogram and boxplot views for numeric variables.</p>
              </div>
              <span className="quality-pill quality-pill-blue">Distributions</span>
            </div>
            <ChartsPanel missingValues={{}} missingPercentages={{}} charts={chartSet} />
          </div>
        )}

        {activeTab === "correlation" && (
          <div className="dashboard-span-12">
            <div className="section-heading">
              <div>
                <h2>Correlation Matrix</h2>
                <p className="section-subtitle">Only the correlation heatmap is shown in this tab.</p>
              </div>
              <span className="quality-pill quality-pill-purple">Correlation</span>
            </div>
            <ChartsPanel missingValues={{}} missingPercentages={{}} charts={chartSet} />
          </div>
        )}

        {activeTab === "preview" && (
          <div className="dashboard-span-12">
            <DataPreviewTable rows={previewRows || analysis.sample_rows} maxRows={reportMode ? null : 10} />
          </div>
        )}
      </div>
    </section>
  );
}

export default DashboardPage;
