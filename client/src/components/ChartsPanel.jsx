import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function ChartsPanel({ missingValues, missingPercentages, charts }) {
  const missingLabels = Object.keys(missingValues || {});
  const missingData = Object.values(missingValues || {});
  const missingWithPercent = missingLabels.map((label) => {
    const count = missingValues?.[label] ?? 0;
    const percent = missingPercentages?.[label];
    return percent === undefined ? `${label}: ${count}` : `${label}: ${count} (${percent}%)`;
  });

  const severityColors = missingLabels.map((label) => {
    const percentage = Number(missingPercentages?.[label] ?? 0);
    if (percentage < 5) return "rgba(16, 185, 129, 0.78)";
    if (percentage < 20) return "rgba(245, 158, 11, 0.78)";
    return "rgba(239, 68, 68, 0.78)";
  });

  const barData = {
    labels: missingWithPercent,
    datasets: [
      {
        label: "Missing Values",
        data: missingData,
        backgroundColor: severityColors,
        borderColor: severityColors,
        borderWidth: 1,
      },
    ],
  };

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Visual Analytics</h2>
          <p className="section-subtitle">Missing value distribution and generated chart outputs.</p>
        </div>
        <span className="quality-pill quality-pill-blue">Charts</span>
      </div>
      {missingLabels.length > 0 && (
        <div className="chart-block chart-card">
          <div className="chart-header">
            <h3>Missing Values Overview</h3>
            <span className="quality-pill quality-pill-yellow">Existing counts + percentages</span>
          </div>
          <div className="chart-frame">
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      )}

      <div className="image-chart-grid">
        {Object.entries(charts || {}).map(([key, value]) => {
          const isHeatmap = key.includes("heatmap");

          return (
            <article key={key} className={`chart-block chart-card${isHeatmap ? " chart-card-heatmap" : ""}`}>
              <div className="chart-header">
                <h3>{key.replaceAll("_", " ")}</h3>
                <span className="quality-pill quality-pill-blue">{isHeatmap ? "Correlation" : "Distribution"}</span>
              </div>
              <div className={`chart-frame chart-frame-image${isHeatmap ? " chart-frame-heatmap" : ""}`}>
                <img src={`data:image/png;base64,${value}`} alt={key} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default ChartsPanel;
