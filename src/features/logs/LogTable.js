export function LogTable(state) {
  return {
    rows: state.events.map((e) => ({
      time: e.time,
      message: e.message,
      level: e.level ?? 'info',
    })),
  };
}
