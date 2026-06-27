import { run, query, get } from '../database/db.js';

export const getMemoryVal = async (key) => {
  try {
    const row = await get("SELECT value FROM memory WHERE key = ?", [key]);
    return row ? row.value : null;
  } catch (err) {
    console.error(`Error reading memory for key ${key}:`, err);
    return null;
  }
};

export const setMemoryVal = async (key, value, category = 'general') => {
  try {
    await run(
      "INSERT OR REPLACE INTO memory (key, value, category, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
      [key, value, category]
    );
    return true;
  } catch (err) {
    console.error(`Error writing memory for key ${key}:`, err);
    return false;
  }
};

export const getAllMemory = async () => {
  try {
    return await query("SELECT * FROM memory");
  } catch (err) {
    console.error('Error fetching all memory:', err);
    return [];
  }
};
