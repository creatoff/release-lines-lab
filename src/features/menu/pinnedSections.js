export function pinnedSections(items) {
  return items.filter((i) => i.pinned).map((i) => i.id);
}
