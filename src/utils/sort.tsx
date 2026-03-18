import type { SortDir, SortField } from "../models/commons";

export function renderSortIndicator(field: SortField, sorts: Array<{field: SortField; dir: SortDir}>) {
  const idx = sorts.findIndex(s => s.field === field);
  if (idx < 0) return null;
  const dir = sorts[idx].dir === 'asc' ? '▲' : '▼';
  return <span style={{ marginLeft: 6, opacity: 0.85 }}>{dir}{sorts.length > 1 ? ` ${idx+1}` : ''}</span>;
}