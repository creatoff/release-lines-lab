export function metadataColumns(item) {
  return { value: item.value, metadata: item.metadata ?? {} };
}
