function normalizeStoredList(items, normalizeItem, validateItem, compareItems) {
  return Array.isArray(items)
    ? items.map(normalizeItem).filter(validateItem).sort(compareItems)
    : [];
}

export function loadStoredList(storageKey, normalizeItem, validateItem, compareItems, label) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return normalizeStoredList(parsed, normalizeItem, validateItem, compareItems);
  } catch (error) {
    console.warn(`Could not read ${label} storage`, error);
    return [];
  }
}

export function saveStoredList(storageKey, items, normalizeItem, validateItem, compareItems, label) {
  try {
    const normalized = normalizeStoredList(items, normalizeItem, validateItem, compareItems);
    localStorage.setItem(storageKey, JSON.stringify(normalized));
    return normalized;
  } catch (error) {
    console.warn(`Could not save ${label} storage`, error);
    return Array.isArray(items) ? items : [];
  }
}
