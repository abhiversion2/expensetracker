// Safe storage management with localStorage persistence and full JSON backup/restore

const STORAGE_KEYS = {
  MEMBERS: 'apna_gang_members',
  EXPENSES: 'apna_gang_expenses',
  CATEGORIES: 'apna_gang_categories',
  SETTINGS: 'apna_gang_settings',
};

export function loadFromStorage(key, fallbackValue) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallbackValue;
  } catch (error) {
    console.error(`Error loading key ${key} from storage`, error);
    return fallbackValue;
  }
}

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving key ${key} to storage`, error);
  }
}

export function clearAllStorage() {
  try {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  } catch (error) {
    console.error('Error clearing storage', error);
  }
}

export { STORAGE_KEYS };
