import { run, query, get } from '../database/db.js';

export const getTasks = async (statusFilter = '') => {
  try {
    if (statusFilter) {
      return await query("SELECT * FROM tasks WHERE status = ? ORDER BY due_date ASC", [statusFilter]);
    }
    return await query("SELECT * FROM tasks ORDER BY due_date ASC");
  } catch (err) {
    console.error('Error fetching tasks via tool:', err);
    return [];
  }
};

export const createLocalTask = async (title, priority, due_date, category = 'General') => {
  try {
    const result = await run(
      "INSERT INTO tasks (title, priority, due_date, status, category) VALUES (?, ?, ?, 'Pending', ?)",
      [title, priority || 'Medium', due_date, category]
    );
    return { id: result.id, title, priority, due_date, status: 'Pending', category };
  } catch (err) {
    console.error('Error creating task via tool:', err);
    return null;
  }
};

export const updateLocalTaskStatus = async (id, status) => {
  try {
    await run("UPDATE tasks SET status = ? WHERE id = ?", [status, id]);
    return true;
  } catch (err) {
    console.error('Error updating task status via tool:', err);
    return false;
  }
};

export const logMood = async (score, comment) => {
  try {
    const result = await run("INSERT INTO mood_logs (score, comment) VALUES (?, ?)", [score, comment]);
    return { id: result.id, score, comment, created_at: new Date().toISOString() };
  } catch (err) {
    console.error('Error logging mood via tool:', err);
    return null;
  }
};
