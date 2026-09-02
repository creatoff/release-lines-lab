import { renderRows, totalLabel } from '../../shared/ui/table/primitives.js';

export function RobotsTable(state) {
  const columns = ['name', 'machine', 'status', 'lastSeen'];
  return {
    rows: renderRows(state.robots, columns),
    counter: totalLabel(state.totalCount, state.robots.length),
  };
}
