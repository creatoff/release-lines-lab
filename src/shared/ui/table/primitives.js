export function renderRows(rows, columns) {
  return rows.map((row) => columns.map((c) => String(row[c] ?? '')).join(' | '));
}

export function totalLabel(total, filtered) {
  if (total === null || total === undefined) return String(filtered);
  if (total === 0) return String(filtered);
  return filtered + ' из ' + total;
}
