import { Database, FileText, Layers3, Sparkles } from "lucide-react";

function SummaryCards({ overview, dtypes }) {
  const typeCount = Object.values(dtypes || {}).reduce((acc, dtype) => {
    acc[dtype] = (acc[dtype] || 0) + 1;
    return acc;
  }, {});

  return (
    <section className="summary-grid summary-metric-grid">
      <article className="summary-card metric-card metric-card-blue">
        <div className="metric-card-top">
          <div>
            <h3>Total Rows</h3>
            <p>{overview?.rows ?? "-"}</p>
            <span className="metric-card-note">Dataset size</span>
          </div>
          <div className="metric-icon metric-icon-blue">
            <Database size={24} />
          </div>
        </div>
      </article>
      <article className="summary-card metric-card metric-card-purple">
        <div className="metric-card-top">
          <div>
            <h3>Total Columns</h3>
            <p>{overview?.columns ?? "-"}</p>
            <span className="metric-card-note">Feature count</span>
          </div>
          <div className="metric-icon metric-icon-purple">
            <FileText size={24} />
          </div>
        </div>
      </article>
      <article className="summary-card metric-card metric-card-green">
        <div className="metric-card-top">
          <div>
            <h3>Memory Usage</h3>
            <p>{overview?.memory_usage_mb ?? "-"}</p>
            <span className="metric-card-note">MB in memory</span>
          </div>
          <div className="metric-icon metric-icon-green">
            <Sparkles size={24} />
          </div>
        </div>
      </article>
      <article className="summary-card metric-card metric-card-yellow">
        <div className="metric-card-top">
          <div>
            <h3>Data Types</h3>
            <p>{Object.keys(typeCount).length}</p>
            <span className="metric-card-note">Unique type groups</span>
          </div>
          <div className="metric-icon metric-icon-yellow">
            <Layers3 size={24} />
          </div>
        </div>
      </article>
    </section>
  );
}

export default SummaryCards;
