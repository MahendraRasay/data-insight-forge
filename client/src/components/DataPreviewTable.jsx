function DataPreviewTable({ rows, maxRows = 10 }) {
  const normalizedRows = Array.isArray(rows) ? rows : [];
  const previewRows = typeof maxRows === "number" ? normalizedRows.slice(0, maxRows) : normalizedRows;
  const columns = previewRows.length > 0 ? Object.keys(previewRows[0]) : [];

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Data Preview</h2>
          <p className="section-subtitle">
            Showing {previewRows.length}
            {typeof maxRows === "number" ? " rows from the uploaded file." : " rows in this report page."}
          </p>
        </div>
      </div>
      {previewRows.length === 0 ? (
        <p>No preview rows available.</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, rowIndex) => (
                <tr key={`preview-${rowIndex}`} className={rowIndex % 2 === 0 ? "table-row-even" : "table-row-odd"}>
                  {columns.map((column) => (
                    <td key={`${column}-${rowIndex}`}>{String(row?.[column] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default DataPreviewTable;
