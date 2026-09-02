export function renderRows(rows, columns) {
  return rows.map((row) => columns.map((c) => String(row[c] ?? '')).join(' | '));
}

export function totalLabel(total, filtered) {
  if (!total) return filtered + ' из ?';
  return filtered + ' из ' + total;
}
