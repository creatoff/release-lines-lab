import { renderRows, totalLabel } from '../../shared/table.js';

export function TasksTable(state) {
  const columns = ['name', 'trigger', 'lastRun'];
  return {
    rows: renderRows(state.tasks, columns),
    counter: totalLabel(state.totalCount, state.tasks.length),
  };
}
