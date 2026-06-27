import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../polaris.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Run commands sequentially
export const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Create tables
      db.run(`
        CREATE TABLE IF NOT EXISTS memory (
          key TEXT PRIMARY KEY,
          value TEXT,
          category TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          priority TEXT,
          due_date TEXT,
          status TEXT,
          category TEXT
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS applications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company TEXT,
          role TEXT,
          status TEXT,
          resume_notes TEXT,
          due_date TEXT
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS flashcards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question TEXT,
          answer TEXT,
          deck_id TEXT
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS study_notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          content TEXT,
          summary TEXT
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS mood_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          score INTEGER,
          comment TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          query TEXT,
          planner_reasoning TEXT,
          raw_agent_logs TEXT,
          final_response TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 2. Check if already seeded, if not seed tables
      db.get("SELECT COUNT(*) as count FROM tasks", [], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row.count === 0) {
          console.log('Database empty. Seeding mock data...');

          // Seed default memory/preferences
          const memoryStmt = db.prepare("INSERT OR REPLACE INTO memory (key, value, category) VALUES (?, ?, ?)");
          memoryStmt.run("student_name", "Lavanya", "profile");
          memoryStmt.run("preferred_study_style", "Pomodoro mixed with active recall and visual mind-maps", "preference");
          memoryStmt.run("current_semester", "Fall 2026", "profile");
          memoryStmt.run("career_goals", "Securing a Software Engineering Internship at Microsoft, Google, or Vercel", "career");
          memoryStmt.run("major", "Computer Science", "profile");
          memoryStmt.finalize();

          // Seed tasks
          const taskStmt = db.prepare("INSERT INTO tasks (title, priority, due_date, status, category) VALUES (?, ?, ?, ?, ?)");
          taskStmt.run("Complete DSA Quiz on Graphs", "High", "2026-06-26", "Pending", "Study");
          taskStmt.run("Prepare Resume for Microsoft Interview", "High", "2026-06-26", "Pending", "Career");
          taskStmt.run("Review Vercel NextJS Routing docs", "Medium", "2026-06-28", "Pending", "Coding");
          taskStmt.run("Read research paper on Transformers", "Low", "2026-07-02", "Completed", "Research");
          taskStmt.run("Hydrate and take a 10m walk during study breaks", "Medium", "2026-06-25", "Pending", "Wellness");
          taskStmt.finalize();

          // Seed applications
          const appStmt = db.prepare("INSERT INTO applications (company, role, status, resume_notes, due_date) VALUES (?, ?, ?, ?, ?)");
          appStmt.run("Microsoft", "SWE Intern", "Interviewing", "Resume screened, technical screen scheduled for Friday.", "2026-06-26");
          appStmt.run("Google", "STEP Intern", "Applied", "Applied online via referral, awaiting response.", "2026-07-10");
          appStmt.run("Vercel", "Frontend Intern", "Offered", "Offer letter received! Reviewing benefits and contract terms.", "2026-06-30");
          appStmt.run("Stripe", "Backend Intern", "Rejected", "Completed final round, rejected due to head count limits.", "2026-06-15");
          appStmt.finalize();

          // Seed study notes & summaries
          const notesStmt = db.prepare("INSERT INTO study_notes (title, content, summary) VALUES (?, ?, ?)");
          notesStmt.run(
            "Graph Traversals (BFS & DFS)",
            "Breadth-First Search (BFS) uses a Queue (FIFO) and is ideal for finding the shortest path in unweighted graphs. Time Complexity: O(V + E). Depth-First Search (DFS) uses a Stack (LIFO or recursion) and is ideal for path finding and detecting cycles. Time complexity is also O(V + E). Space complexity is O(V) for storing visited nodes.",
            "BFS uses a queue and finds shortest path in unweighted graphs. DFS uses recursion/stack and is best for cycle detection. Both have O(V + E) time complexity."
          );
          notesStmt.run(
            "Introduction to Transformers",
            "Transformers are deep learning models designed by Google in 2017. They use Self-Attention mechanisms instead of recurrent systems (RNNs) to process sequence data in parallel, enabling huge scaling. Key parts are Multi-Head Attention, Feed-forward blocks, and Positional Encodings.",
            "Transformers leverage parallel self-attention instead of RNNs to process sequential data. Components include Multi-Head Attention and Positional Encodings."
          );
          notesStmt.finalize();

          // Seed flashcards
          const flashStmt = db.prepare("INSERT INTO flashcards (question, answer, deck_id) VALUES (?, ?, ?)");
          flashStmt.run("What data structure is BFS implemented with?", "A Queue (First-In, First-Out).", "dsa-graphs");
          flashStmt.run("What is the time complexity of both BFS and DFS?", "O(V + E) where V is vertices and E is edges.", "dsa-graphs");
          flashStmt.run("What does Self-Attention solve in Transformer models?", "It allows the model to dynamic focus on different words in a sentence, regardless of their distance.", "nlp-transformers");
          flashStmt.finalize();

          // Seed mood logs
          const moodStmt = db.prepare("INSERT INTO mood_logs (score, comment) VALUES (?, ?)");
          moodStmt.run(4, "Felt motivated and finished my React practice project.");
          moodStmt.run(2, "Feeling stressed about the upcoming DSA assignment deadline.");
          moodStmt.run(3, "Balanced study day, completed Pomodoro sessions.");
          moodStmt.finalize();
        }

        console.log('Database initialized successfully.');
        resolve();
      });
    });
  });
};

// Helper methods to query DB as promises
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const resetDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('DELETE FROM chat_sessions');
      db.run('DELETE FROM mood_logs');
      db.run('DELETE FROM flashcards');
      db.run('DELETE FROM study_notes');
      db.run('DELETE FROM applications');
      db.run('DELETE FROM tasks');
      db.run('DELETE FROM memory', (err) => {
        if (err) {
          reject(err);
          return;
        }

        initDb()
          .then(resolve)
          .catch(reject);
      });
    });
  });
};

export default db;
