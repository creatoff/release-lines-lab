export function inlineFilters(initial) {
  let value = { ...initial };
  return {
    get: () => value,
    set: (patch) => {
      value = { ...value, ...patch };
    },
    refresh: () => {
      return value;
    },
  };
}
