import { openDB } from './idb.js';

const DB_NAME = 'isparmo-cache';
const DB_VERSION = 1;
const STORE_NAME = 'api-data';

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function getCachedData(key) {
  try {
    const db = await initDB();
    return await db.get(STORE_NAME, key);
  } catch (e) {
    console.error("IndexedDB get error:", e);
    return null;
  }
}

export async function setCachedData(key, data) {
  try {
    const db = await initDB();
    return await db.put(STORE_NAME, data, key);
  } catch (e) {
    console.error("IndexedDB set error:", e);
  }
}
