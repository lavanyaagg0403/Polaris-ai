import { query, run } from '../database/db.js';

const agentNames = {
  study: 'Study Agent',
  career: 'Career Agent',
  coding: 'Coding Agent',
  research: 'Research Agent',
  productivity: 'Productivity Agent'
};

export async function getStudentContext() {
  const context = {
    name: 'Student',
    studyStyle: '',
    careerGoal: '',
    major: '',
    semester: ''
  };

  try {
    const rows = await query('SELECT key, value FROM memory');
    rows.forEach(r => {
      if (r.key === 'student_name') context.name = r.value;
      if (r.key === 'preferred_study_style') context.studyStyle = r.value;
      if (r.key === 'career_goals') context.careerGoal = r.value;
      if (r.key === 'major') context.major = r.value;
      if (r.key === 'current_semester') context.semester = r.value;
    });
  } catch (err) {
    console.error('Error fetching student memory:', err);
  }

  return context;
}

async function getOperationalContext() {
  try {
    const [tasks, applications, mood, notes] = await Promise.all([
      query("SELECT * FROM tasks WHERE status != 'Completed' ORDER BY due_date ASC LIMIT 8"),
      query('SELECT * FROM applications ORDER BY due_date ASC LIMIT 6'),
      query('SELECT * FROM mood_logs ORDER BY created_at DESC LIMIT 3'),
      query('SELECT * FROM study_notes ORDER BY id DESC LIMIT 3')
    ]);

    return { tasks, applications, mood, notes };
  } catch (err) {
    console.error('Error fetching operational context:', err);
    return { tasks: [], applications: [], mood: [], notes: [] };
  }
}

function includesAny(text, words) {
  const lower = text.toLowerCase();
  return words.some(word => lower.includes(word));
}

function detectAgents(prompt) {
  const agents = new Set(['productivity']);
  if (includesAny(prompt, ['study', 'exam', 'quiz', 'assignment', 'class', 'flashcard', 'dsa'])) agents.add('study');
  if (includesAny(prompt, ['interview', 'resume', 'intern', 'career', 'job', 'offer', 'application', 'microsoft', 'google', 'vercel'])) agents.add('career');
  if (includesAny(prompt, ['code', 'debug', 'bug', 'javascript', 'python', 'algorithm', 'runtime'])) agents.add('coding');
  if (includesAny(prompt, ['research', 'paper', 'citation', 'abstract', 'summary'])) agents.add('research');
  if (includesAny(prompt, ['overwhelmed', 'stress', 'stressed', 'anxious', 'plan', 'prioritize', 'schedule', 'focus'])) agents.add('productivity');
  return Array.from(agents);
}

function nextDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

async function createSuggestedTasks(prompt, agents) {
  const lower = prompt.toLowerCase();
  const candidates = [];

  if (agents.includes('career') || lower.includes('microsoft')) {
    candidates.push(['Microsoft interview prep block', 'High', nextDate(1), 'Career']);
  }
  if (agents.includes('study') || lower.includes('dsa')) {
    candidates.push(['Review BFS and DFS graph patterns', 'High', nextDate(1), 'Study']);
  }
  if (agents.includes('productivity') || lower.includes('overwhelmed')) {
    candidates.push(['Take a 10-minute reset before the next focus block', 'Medium', nextDate(0), 'Wellness']);
  }

  const created = [];
  for (const [title, priority, dueDate, category] of candidates) {
    try {
      const existing = await query('SELECT id FROM tasks WHERE title = ? LIMIT 1', [title]);
      if (existing.length) continue;
      const result = await run(
        "INSERT INTO tasks (title, priority, due_date, status, category) VALUES (?, ?, ?, 'Pending', ?)",
        [title, priority, dueDate, category]
      );
      created.push({ id: result.id, title, priority, due_date: dueDate, status: 'Pending', category });
    } catch (err) {
      console.error('Error creating suggested task:', err);
    }
  }

  return created;
}

function buildFinalResponse(prompt, studentContext, operationalContext, agents, createdTasks) {
  const pendingTasks = operationalContext.tasks.filter(task => task.status !== 'Completed');
  const nextTask = pendingTasks[0];
  const nextApplication = operationalContext.applications.find(app => String(app.status || '').toLowerCase() === 'interviewing');
  const latestMood = operationalContext.mood[0];

  const lines = [
    `### ${studentContext.name || 'Student'}, here is a focused Polaris plan`,
    '',
    `I routed this through ${agents.map(agent => agentNames[agent]).join(', ')} based on your message: "${prompt}".`,
    ''
  ];

  if (nextTask) {
    lines.push(`- Start with **${nextTask.title}** because it is marked ${nextTask.priority || 'Medium'} priority${nextTask.due_date ? ` and due ${nextTask.due_date}` : ''}.`);
  } else {
    lines.push('- Your task list is clear, so use this as a planning block rather than a catch-up block.');
  }

  if (nextApplication) {
    lines.push(`- Keep **${nextApplication.company} ${nextApplication.role}** warm: rehearse two project stories and one DSA walkthrough before the next deadline.`);
  }

  if (latestMood && latestMood.score <= 2) {
    lines.push('- Your latest mood check-in looks strained, so keep the first block small: water, breathe, then 25 minutes on one task.');
  }

  if (createdTasks.length) {
    lines.push('', 'I also added these suggested checklist items:');
    createdTasks.forEach(task => {
      lines.push(`- ${task.title} (${task.priority}, ${task.category})`);
    });
  }

  lines.push('', 'Use one focus block, update the checklist, then come back with what changed and I will re-plan the next step.');
  return lines.join('\n');
}

export const processAgentRequest = async (userPrompt, conversationHistory = []) => {
  const studentContext = await getStudentContext();
  const operationalContext = await getOperationalContext();
  const agents = detectAgents(userPrompt);
  const createdTasks = await createSuggestedTasks(userPrompt, agents);

  const agentLogs = agents.map(agent => ({
    agent: agentNames[agent],
    action: `${agentNames[agent]} reviewed local Polaris data and prepared a no-key demo response.`
  }));

  if (conversationHistory.length) {
    agentLogs.push({
      agent: 'Conversation Memory',
      action: `Used ${Math.min(conversationHistory.length, 12)} recent turns from this session for continuity.`
    });
  }

  return {
    plannerReasoning: `Polaris matched the request to ${agents.map(agent => agentNames[agent]).join(', ')} and used local tasks, applications, notes, and memory only.`,
    agentLogs,
    finalResponse: buildFinalResponse(userPrompt, studentContext, operationalContext, agents, createdTasks)
  };
};

function analyzeResume(text = '') {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const hasImpact = /\d|%|increased|reduced|built|launched|optimized/i.test(text);
  const hasProjects = /project|github|portfolio|app|system/i.test(text);
  const hasLeadership = /led|mentor|coordinated|organized|team/i.test(text);
  const score = Math.min(92, 45 + Math.min(wordCount, 250) / 5 + (hasImpact ? 15 : 0) + (hasProjects ? 10 : 0) + (hasLeadership ? 8 : 0));

  return {
    score: Math.round(score),
    strengths: [
      hasProjects ? 'Project experience is visible.' : 'The resume has a base structure ready for stronger project detail.',
      hasImpact ? 'Some impact-oriented language or metrics are present.' : 'It can become stronger with numbers and outcome statements.'
    ],
    gaps: [
      'Add concise bullets that show action, technical scope, and result.',
      'Tailor the top skills and projects to the role before submitting.'
    ],
    suggestions: 'Use bullets shaped like: **Built X using Y, improving Z by N**. Keep the strongest technical project near the top and mirror keywords from the internship description.'
  };
}

function interviewQuestions(payload) {
  const company = payload.company || 'the company';
  const role = payload.role || 'the role';
  return {
    questions: [
      { q: `Walk me through a project that proves you are ready for ${role} at ${company}.`, tips: 'Use problem, constraints, tradeoffs, result.' },
      { q: 'How would you debug a slow endpoint or UI interaction?', tips: 'Start with measurement, isolate the layer, then propose fixes.' },
      { q: 'Tell me about a time you learned a technical topic quickly.', tips: 'Show your learning loop and how you validated progress.' }
    ]
  };
}

function explainCode(code = '', language = 'code') {
  return `### ${language} walkthrough\n\n- Identify the inputs, outputs, and state that changes over time.\n- Trace the main loop or function calls with one small example.\n- Watch for edge cases: empty input, missing keys, duplicate values, and mutation.\n\n\`\`\`\n${code.slice(0, 1200) || 'Paste code to inspect it here.'}\n\`\`\``;
}

function debugCode(code = '', language = 'code') {
  const hints = [];
  if (/queue\.shift\(\)/.test(code)) hints.push('`queue.shift()` is correct for BFS, but it can become O(n) per pop on large JavaScript arrays.');
  if (/while\s*\([^)]*queue/.test(code) && !/visited/.test(code)) hints.push('Graph traversals usually need a visited set to avoid cycles.');
  if (!code.trim()) hints.push('Paste a snippet and Polaris will inspect control flow, state, and edge cases.');
  if (!hints.length) hints.push('No obvious syntax issue found in the visible snippet. Trace it with a tiny input and verify each mutation.');

  return `### ${language} debug notes\n\n${hints.map(hint => `- ${hint}`).join('\n')}`;
}

function dsaChallenge(language = 'JavaScript') {
  return `### Practice challenge\n\nImplement **shortest path in an unweighted graph** in ${language}.\n\n- Input: adjacency list and a start/end node.\n- Return: the shortest path as an array, or an empty array if unreachable.\n- Hint 1: Use BFS with a queue.\n- Hint 2: Store each node's parent so you can reconstruct the path.`;
}

export async function processHubRequest({ agent, action, payload = {} }) {
  const key = `${agent}_${action}`;

  switch (key) {
    case 'career_analyze_resume':
      return analyzeResume(payload.resumeText || '');
    case 'career_interview_questions':
      return interviewQuestions(payload);
    case 'coding_debug':
      return { text: debugCode(payload.code, payload.language) };
    case 'coding_explain':
      return { text: explainCode(payload.code, payload.language) };
    case 'coding_dsa':
      return { text: dsaChallenge(payload.language) };
    case 'research_summarize_paper':
      return {
        findings: [
          'The abstract defines the central problem and method.',
          'Extract the dataset, evaluation metric, and strongest result before citing it.',
          'Compare limitations against your own research question.'
        ],
        summary: `${payload.title || 'This paper'} appears to focus on ${String(payload.abstract || 'the provided topic').slice(0, 160)}. Use this as a first-pass summary, then refine with the full paper text.`
      };
    case 'research_generate_citation':
      return {
        citation: `${payload.author || 'Author'}. (${payload.year || 'n.d.'}). ${payload.title || 'Untitled work'}. ${payload.journal || 'Source not specified'}.`
      };
    default: {
      const err = new Error(`Unknown hub action: ${agent}/${action}`);
      err.code = 'INVALID_HUB_ACTION';
      throw err;
    }
  }
}
