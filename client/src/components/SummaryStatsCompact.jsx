import { useMemo, useState } from "react";

const STAT_ORDER = ["count", "mean", "std", "min", "25%", "50%", "75%", "max"];

function formatStatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const abs = Math.abs(value);
    const decimals = abs >= 100 ? 2 : 3;
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  }

  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && Number.isFinite(asNumber)) {
    const abs = Math.abs(asNumber);
    const decimals = abs >= 100 ? 2 : 3;
    return asNumber.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  }

  return String(value);
}

function SummaryStatsCompact({ summary }) {
  const columns = summary && typeof summary === "object" ? Object.keys(summary) : [];
  const [query, setQuery] = useState("");

  const filteredColumns = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return columns;
    }

    return columns.filter((column) => column.toLowerCase().includes(normalized));
  }, [columns, query]);

  const statsMatrix = useMemo(() => {
    return filteredColumns.map((column) => {
      const values = summary?.[column] || {};
      const orderedValues = STAT_ORDER.filter((key) => key in values).map((key) => [key, values[key]]);
      const extraValues = Object.entries(values).filter(([key]) => !STAT_ORDER.includes(key));

      return {
        column,
        values: [...orderedValues, ...extraValues],
      };
    });
  }, [filteredColumns, summary]);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Summary Statistics</h2>
          <p className="section-subtitle">Search across columns and compare descriptive statistics in one table.</p>
        </div>
        <span className="quality-pill quality-pill-blue">Searchable table</span>
      </div>

      {columns.length === 0 ? (
        <p>No summary statistics available.</p>
      ) : (
        <div className="summary-compact-layout">
          <label className="summary-search-wrap" htmlFor="summary-column-search">
            <span className="summary-select-label">Search Column</span>
            <input
              id="summary-column-search"
              className="summary-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type a column name"
            />
          </label>

          <div className="table-scroll summary-table-scroll">
            <table className="data-table summary-table">
              <thead>
                <tr>
                  <th>Column</th>
                  {STAT_ORDER.map((label) => (
                    <th key={label} className={label === "mean" || label === "std" ? "summary-key-metric" : ""}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {statsMatrix.map(({ column, values }, rowIndex) => {
                  const valueMap = Object.fromEntries(values);

                  return (
                    <tr key={column} className={rowIndex % 2 === 0 ? "table-row-even" : "table-row-odd"}>
                      <td className="summary-column-cell">{column}</td>
                      {STAT_ORDER.map((label) => (
                        <td
                          key={`${column}-${label}`}
                          className={`summary-value-cell ${label === "mean" || label === "std" ? "summary-key-metric" : ""}`}
                        >
                          {Object.prototype.hasOwnProperty.call(valueMap, label) ? formatStatValue(valueMap[label]) : "-"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredColumns.length === 0 && <p className="empty-state-text">No columns match your search.</p>}
        </div>
      )}
    </section>
  );
}

export default SummaryStatsCompact;
