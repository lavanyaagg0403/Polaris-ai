import express from 'express';
import { query, run, get, resetDatabase } from '../database/db.js';
import { processAgentRequest, processHubRequest } from '../services/llmService.js';

const router = express.Router();

function aiErrorResponse(err, res) {
  console.error('Polaris request failed:', err.message);
  return res.status(500).json({
    error: 'Polaris could not process that request. Please try again with a little more detail.'
  });
}

// Hub-specific AI actions
router.post('/ai/hub', async (req, res) => {
  const { agent, action, payload } = req.body || {};
  if (!agent || !action) {
    return res.status(400).json({ error: 'agent and action are required' });
  }

  try {
    const result = await processHubRequest({ agent, action, payload: payload || {} });
    res.json(result);
  } catch (err) {
    if (err.code === 'INVALID_HUB_ACTION') {
      return res.status(400).json({ error: err.message });
    }
    return aiErrorResponse(err, res);
  }
});

// 1. Chat Coordination Endpoint
router.post('/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const aiResponse = await processAgentRequest(message, Array.isArray(history) ? history : []);
    const safeAiResponse = {
      plannerReasoning: aiResponse?.plannerReasoning || 'Polaris routed this request through the most relevant student agents.',
      agentLogs: Array.isArray(aiResponse?.agentLogs) ? aiResponse.agentLogs : [],
      finalResponse: aiResponse?.finalResponse || 'Polaris processed your request, but the model returned an incomplete response. Please try again with a little more detail.'
    };

    const insertSql = `
      INSERT INTO chat_sessions (query, planner_reasoning, raw_agent_logs, final_response)
      VALUES (?, ?, ?, ?)
    `;
    const agentLogsStr = JSON.stringify(safeAiResponse.agentLogs);
    const result = await run(insertSql, [
      message,
      safeAiResponse.plannerReasoning,
      agentLogsStr,
      safeAiResponse.finalResponse
    ]);

    res.json({
      id: result.id,
      query: message,
      plannerReasoning: safeAiResponse.plannerReasoning,
      agentLogs: safeAiResponse.agentLogs,
      finalResponse: safeAiResponse.finalResponse,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    return aiErrorResponse(err, res);
  }
});

// GET Chat history
router.get('/chat/history', async (req, res) => {
  try {
    const history = await query("SELECT * FROM chat_sessions ORDER BY created_at DESC LIMIT 15");
    const parsed = history.map(h => {
      let agentLogs = [];
      try {
        agentLogs = JSON.parse(h.raw_agent_logs || '[]');
      } catch {
        agentLogs = [];
      }
      return {
        id: h.id,
        query: h.query || '',
        plannerReasoning: h.planner_reasoning || '',
        agentLogs: Array.isArray(agentLogs) ? agentLogs : [],
        finalResponse: h.final_response || '',
        created_at: h.created_at
      };
    });
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Dashboard Stats Endpoint
router.get('/dashboard', async (req, res) => {
  try {
    const totalTasks = await get("SELECT COUNT(*) as count FROM tasks");
    const pendingTasks = await get("SELECT COUNT(*) as count FROM tasks WHERE status != 'Completed'");
    const completedTasks = await get("SELECT COUNT(*) as count FROM tasks WHERE status = 'Completed'");
    const urgentTasks = await query("SELECT * FROM tasks WHERE priority = 'High' AND status != 'Completed' LIMIT 3");
    
    // Application tracker summary
    const appStats = await query("SELECT status, COUNT(*) as count FROM applications GROUP BY status");
    const appsList = await query("SELECT * FROM applications ORDER BY due_date ASC LIMIT 5");

    // Mood overview
    const moodStats = await query("SELECT * FROM mood_logs ORDER BY created_at DESC LIMIT 7");

    // Study notes
    const noteCount = await get("SELECT COUNT(*) as count FROM study_notes");

    // Generate active AI recommendation from current student data.
    const today = new Date().toISOString().slice(0, 10);
    const allPendingTasks = await query(
      "SELECT * FROM tasks WHERE status != 'Completed' ORDER BY due_date ASC, CASE priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 ELSE 2 END LIMIT 8"
    );
    const upcomingInterviews = await query(
      "SELECT * FROM applications WHERE LOWER(status) = 'interviewing' ORDER BY due_date ASC LIMIT 3"
    );
    const overdueTasks = allPendingTasks.filter(task => task.due_date && task.due_date < today);
    const dueTodayTasks = allPendingTasks.filter(task => task.due_date === today);
    const nextInterview = upcomingInterviews[0];
    const latestMood = moodStats[0];

    let recommendation = "You are in good shape. Use one focused study block today to review your highest-impact material, then update your task list.";
    if (overdueTasks.length > 0) {
      recommendation = `You have ${overdueTasks.length} overdue task${overdueTasks.length === 1 ? '' : 's'}. Start with "${overdueTasks[0].title}" and use a 25-minute focus block before opening anything new.`;
    } else if (dueTodayTasks.length > 0) {
      recommendation = `You have ${dueTodayTasks.length} task${dueTodayTasks.length === 1 ? '' : 's'} due today. Prioritize "${dueTodayTasks[0].title}" first, then reassess the remaining checklist.`;
    } else if (nextInterview) {
      recommendation = `Your ${nextInterview.company} ${nextInterview.role} interview pipeline needs attention. Schedule mock practice around ${nextInterview.due_date} and review resume stories with the STAR format.`;
    } else if (pendingTasks.count > 4) {
      recommendation = "You have several pending tasks. Pick the highest-priority study or career item, timebox it, and defer lower-priority work until after one completed block.";
    } else if (latestMood && latestMood.score <= 2) {
      recommendation = "Your latest wellness check-in looks strained. Pair the next work session with a short reset: water, breathing, then one small task only.";
    } else if (noteCount.count > 0) {
      recommendation = "You have saved study notes ready for review. Convert one note into flashcards or run a short quiz before starting new material.";
    }

    let studentName = 'Student';
    try {
      const nameRow = await get("SELECT value FROM memory WHERE key = 'student_name'");
      if (nameRow?.value) studentName = nameRow.value;
    } catch {
      // keep default
    }

    const studyTotal = totalTasks.count || 0;
    const studyCompleted = completedTasks.count || 0;
    const studyProgress = studyTotal ? Math.round((studyCompleted / studyTotal) * 100) : 0;

    res.json({
      tasks: {
        total: totalTasks.count,
        pending: pendingTasks.count,
        completed: completedTasks.count,
        urgent: urgentTasks
      },
      applications: {
        stats: appStats,
        recent: appsList
      },
      mood: moodStats,
      notesCount: noteCount.count,
      aiRecommendation: recommendation,
      studentName,
      studyProgress
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard statistics' });
  }
});

// 3. Tasks CRUD
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await query("SELECT * FROM tasks ORDER BY due_date ASC");
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tasks', async (req, res) => {
  const { title, priority, due_date, status, category } = req.body;
  try {
    const result = await run(
      "INSERT INTO tasks (title, priority, due_date, status, category) VALUES (?, ?, ?, ?, ?)",
      [title, priority || 'Medium', due_date, status || 'Pending', category || 'General']
    );
    res.json({ id: result.id, title, priority, due_date, status, category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, priority, due_date, status, category } = req.body;
  try {
    await run(
      "UPDATE tasks SET title = ?, priority = ?, due_date = ?, status = ?, category = ? WHERE id = ?",
      [title, priority, due_date, status, category, id]
    );
    res.json({ id, title, priority, due_date, status, category });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    await run("DELETE FROM tasks WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Applications CRUD
router.get('/applications', async (req, res) => {
  try {
    const apps = await query("SELECT * FROM applications ORDER BY due_date ASC");
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/applications', async (req, res) => {
  const { company, role, status, resume_notes, due_date } = req.body;
  try {
    const result = await run(
      "INSERT INTO applications (company, role, status, resume_notes, due_date) VALUES (?, ?, ?, ?, ?)",
      [company, role, status || 'Applied', resume_notes, due_date]
    );
    res.json({ id: result.id, company, role, status, resume_notes, due_date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/applications/:id', async (req, res) => {
  const { id } = req.params;
  const { company, role, status, resume_notes, due_date } = req.body;
  try {
    await run(
      "UPDATE applications SET company = ?, role = ?, status = ?, resume_notes = ?, due_date = ? WHERE id = ?",
      [company, role, status, resume_notes, due_date, id]
    );
    res.json({ id, company, role, status, resume_notes, due_date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/applications/:id', async (req, res) => {
  try {
    await run("DELETE FROM applications WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Study Notes CRUD
router.get('/study/notes', async (req, res) => {
  try {
    const notes = await query("SELECT * FROM study_notes ORDER BY id DESC");
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/study/notes', async (req, res) => {
  const { title, content, summary } = req.body;
  try {
    const noteSummary = summary || content.substring(0, 100) + '...';
    const result = await run(
      "INSERT INTO study_notes (title, content, summary) VALUES (?, ?, ?)",
      [title, content, noteSummary]
    );
    res.json({ id: result.id, title, content, summary: noteSummary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/study/notes/:id', async (req, res) => {
  try {
    await run("DELETE FROM study_notes WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Flashcards CRUD
router.get('/study/flashcards', async (req, res) => {
  try {
    const flashcards = await query("SELECT * FROM flashcards ORDER BY id DESC");
    res.json(flashcards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/study/flashcards', async (req, res) => {
  const { question, answer, deck_id } = req.body;
  try {
    const result = await run(
      "INSERT INTO flashcards (question, answer, deck_id) VALUES (?, ?, ?)",
      [question, answer, deck_id || 'general']
    );
    res.json({ id: result.id, question, answer, deck_id: deck_id || 'general' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/study/flashcards/:id', async (req, res) => {
  try {
    await run("DELETE FROM flashcards WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Mood Logs Endpoint
router.get('/mood', async (req, res) => {
  try {
    const logs = await query("SELECT * FROM mood_logs ORDER BY created_at DESC LIMIT 30");
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/mood', async (req, res) => {
  const { score, comment } = req.body;
  try {
    const result = await run("INSERT INTO mood_logs (score, comment) VALUES (?, ?)", [score, comment]);
    res.json({ id: result.id, score, comment, created_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Memory/Preferences Endpoint
router.get('/memory', async (req, res) => {
  try {
    const mems = await query("SELECT * FROM memory");
    res.json(mems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/memory', async (req, res) => {
  const { key, value, category } = req.body;
  try {
    await run("INSERT OR REPLACE INTO memory (key, value, category) VALUES (?, ?, ?)", [key, value, category || 'general']);
    res.json({ key, value, category: category || 'general' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/system/reset', async (req, res) => {
  try {
    await resetDatabase();
    res.json({ success: true, message: 'Database reset to factory defaults.' });
  } catch (err) {
    console.error('Database reset failed:', err);
    res.status(500).json({ error: 'Failed to reset database.' });
  }
});

export default router;
