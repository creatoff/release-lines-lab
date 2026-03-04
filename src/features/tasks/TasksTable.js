import { renderRows, totalLabel } from '../../shared/ui/table/primitives.js';

export function TasksTable(state) {
  const columns = ['name', 'trigger', 'lastRun'];
  return {
    rows: renderRows(state.tasks, columns),
    counter: totalLabel(state.totalCount, state.tasks.length),
  };
}
