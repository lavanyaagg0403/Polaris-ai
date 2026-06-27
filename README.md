# AI Agents: Intensive Vibe Coding Capstone Project

# Polaris AI

> AI-powered Student Operating System for productivity, career planning, coding practice, research, and academic organization.

🚀 **Built during the 5-Day AI Agent Vibe Coding Hackathon** as a capstone project, Polaris AI demonstrates a full-stack student productivity platform with a React frontend, Express backend, SQLite database, and a local multi-agent architecture.

---

## ✨ Features

- 🤖 AI-inspired Command Center with local multi-agent routing
- 📚 Study Notes & Flashcards
- 💼 Career Application Tracker
- 💻 Coding Assistant
- 🔬 Research Workspace
- ✅ Task Management
- 🍅 Pomodoro Focus Timer
- 😊 Mood Tracking
- 🧠 Student Memory & Personalized Dashboard

---

## 📸 Screenshots
## 📸 Screenshots

### Dashboard

<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/c35a08d5-033c-4892-918d-e9ccf5f92814" />

### Command Center

<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/e2d27593-4a6c-4f53-b78d-aa2121cfa28f" />


### Career Hub

<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/77dd223a-a394-4db5-a19c-24d681bb6e41" />


### Coding Hub

<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/ff56e396-0390-4034-9055-41da143084d9" />

---

## Project Overview

Polaris AI helps students organize academics, career preparation, coding practice, research, productivity, and wellness from a single dashboard.

The application combines multiple student-focused tools into one platform with a local AI-inspired command center.

The current implementation uses a local deterministic agent service, meaning the project runs immediately after installation with **no API keys or external AI providers required.**


## Tech Stack

### Frontend

- React
- Vite
- Lucide React icons
- CSS modules/global styling through `src/index.css` and `src/App.css`

### Backend

- Node.js
- Express
- SQLite
- `sqlite3`
- CORS

### Development Tooling

- Concurrently for running frontend and backend together
- Nodemon for backend development
- Vite build tooling for frontend bundling

## Repository Structure

```text
.
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   └── db.js
│   │   ├── routes/
│   │   │   └── api.js
│   │   ├── services/
│   │   │   └── llmService.js
│   │   ├── tools/
│   │   │   ├── calendarTool.js
│   │   │   ├── fileTool.js
│   │   │   ├── memoryTool.js
│   │   │   └── webSearchTool.js
│   │   └── server.js
│   ├── tests/
│   │   └── verifyDemo.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── package-lock.json
├── package.json
├── package-lock.json
└── README.md
```

## Core Features

### Dashboard

The home dashboard summarizes the student's current state:

- High-priority task list
- AI-style local recommendation based on stored tasks, applications, study notes, and mood logs
- Application pipeline counts
- Upcoming application deadline
- Study progress
- Task completion progress
- Wellness status

### Ask Polaris / Command Center

The Command Center supports conversational student planning. User prompts are processed by a local internal agent service in `backend/src/services/llmService.js`.

The service can route requests to these local agents:

- Study Agent
- Career Agent
- Coding Agent
- Research Agent
- Productivity Agent

Responses include:

- Planner reasoning
- Agent logs
- A final Markdown response
- Optional locally generated task suggestions

Chat history is stored in SQLite through the `chat_sessions` table.

### Study Hub

The Study Hub works with backend study endpoints for:

- Study notes
- Note summaries
- Flashcards
- Deck identifiers

### Career Hub

The Career Hub supports:

- Application tracking
- Application statuses
- Resume notes
- Deadlines
- Local resume analysis
- Local interview question generation

### Coding Hub

The Coding Hub includes:

- Code editor templates for multiple languages
- JavaScript execution in the browser
- Local debug notes
- Local code explanation
- DSA practice challenge generation
- DSA pattern directory

### Research Hub

The Research Hub includes:

- Research paper/document entries
- Abstract summaries
- Key findings
- Citation formatting
- Reference shelf UI

### Productivity and Wellness

The Productivity Hub includes:

- Task creation and completion
- Priority and category assignment
- Pomodoro focus timer
- Study/break modes
- Mood score logging
- Mood journal entries

### Settings

Settings includes:

- Student memory profile
- Name, major, semester, study style, and career goals
- Database reset to factory seed data

## Backend API Summary

The backend API is mounted at `/api`.

Main endpoints include:

- `GET /health` - backend health check
- `POST /api/chat` - Ask Polaris command center request
- `GET /api/chat/history` - recent chat history
- `POST /api/ai/hub` - hub-specific local agent actions
- `GET /api/dashboard` - dashboard summary data
- `GET /api/tasks` - list tasks
- `POST /api/tasks` - create task
- `PUT /api/tasks/:id` - update task
- `DELETE /api/tasks/:id` - delete task
- `GET /api/applications` - list career applications
- `POST /api/applications` - create application
- `PUT /api/applications/:id` - update application
- `DELETE /api/applications/:id` - delete application
- `GET /api/study/notes` - list study notes
- `POST /api/study/notes` - create study note
- `DELETE /api/study/notes/:id` - delete study note
- `GET /api/study/flashcards` - list flashcards
- `POST /api/study/flashcards` - create flashcard
- `DELETE /api/study/flashcards/:id` - delete flashcard
- `GET /api/mood` - list mood logs
- `POST /api/mood` - create mood log
- `GET /api/memory` - list student memory values
- `POST /api/memory` - save memory value
- `POST /api/system/reset` - reset database to seeded defaults

## Local Data and Persistence

Polaris uses SQLite for local persistence. The database is initialized by `backend/src/database/db.js`.

On first run, the backend creates and seeds tables for:

- Memory
- Tasks
- Applications
- Flashcards
- Study notes
- Mood logs
- Chat sessions

The seeded data includes sample student memory, tasks, applications, notes, flashcards, and mood logs so the app can be explored immediately after setup.

## Requirements

- Node.js
- npm

No API keys are required.

## Installation

From the project root:

```bash
npm install
npm run install:backend
npm run install:frontend
```

Or use the combined script:

```bash
npm run install:all
```

## Running Locally

From the project root:

```bash
npm run dev
```

This starts:

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

Health check:

```bash
http://localhost:5000/health
```

Open the app:

```bash
http://localhost:5173/
```

## Useful Scripts

Root scripts:

```bash
npm run dev
npm run backend
npm run frontend
npm run install:all
npm run install:backend
npm run install:frontend
```

Backend scripts:

```bash
npm start
npm run dev
```

Frontend scripts:

```bash
npm run dev
npm run build
npm run preview
```

## Verification

The backend includes a demo verification script:

```bash
cd backend
node tests/verifyDemo.js
```

The frontend production build can be verified with:

```bash
cd frontend
npm run build
```

## Current AI Architecture

The current project does not call external AI providers. The agent behavior is implemented locally in `backend/src/services/llmService.js`.

This service:

- Reads student context from SQLite memory.
- Reads operational context from local tasks, applications, mood logs, and study notes.
- Detects relevant student agents from prompt keywords.
- Generates planner reasoning, agent logs, and Markdown responses.
- Provides local hub actions for resume analysis, interview questions, code debugging, code explanation, DSA practice, paper summaries, and citations.

This makes the app runnable immediately after install with no secrets or extra configuration.

## Future Roadmap

Potential next steps:

- Add user authentication and multi-user workspaces.
- Add richer study scheduling and calendar integration.
- Add import/export for notes, resumes, and research files.
- Add more robust code execution sandboxes per language.
- Add optional external AI provider adapters behind a clear configuration layer.
- Add automated frontend and backend test coverage.
- Add deployment scripts for hosted environments.
- Improve accessibility and responsive polish across all pages.

## Project Status

Polaris AI is currently a functional local MVP. It is designed for capstone demonstration, local development, and continued iteration into a more complete student productivity platform.
