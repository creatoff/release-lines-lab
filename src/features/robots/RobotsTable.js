import { renderRows, totalLabel } from '../../shared/table.js';

export function RobotsTable(state) {
  const columns = ['name', 'machine', 'status'];
  return {
    rows: renderRows(state.robots, columns),
    counter: totalLabel(state.totalCount, state.robots.length),
  };
}
