import React, { useState } from 'react';
import { Code, Terminal, Play, HelpCircle, Bug, AlertCircle, RefreshCw } from 'lucide-react';
import { apiJson } from '../lib/api';

const languages = [
  { id: 'javascript', label: 'JavaScript', executable: true, template: `function bfs(graph, start) {
  const queue = [start];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const node = queue.shift();
    console.log(node);

    for (const neighbor of graph[node] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}` },
  { id: 'typescript', label: 'TypeScript', executable: false, template: `function bfs(graph: Record<string, string[]>, start: string): string[] {
  const queue: string[] = [start];
  const visited = new Set<string>([start]);
  const order: string[] = [];

  while (queue.length) {
    const node = queue.shift()!;
    order.push(node);
    for (const neighbor of graph[node] ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return order;
}` },
  { id: 'python', label: 'Python', executable: false, template: `from collections import deque

def bfs(graph, start):
    queue = deque([start])
    visited = {start}

    while queue:
        node = queue.popleft()
        print(node)
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)` },
  { id: 'java', label: 'Java', executable: false, template: `import java.util.*;

class Main {
  static List<String> bfs(Map<String, List<String>> graph, String start) {
    Queue<String> queue = new ArrayDeque<>();
    Set<String> visited = new HashSet<>();
    List<String> order = new ArrayList<>();
    queue.add(start);
    visited.add(start);
    while (!queue.isEmpty()) {
      String node = queue.poll();
      order.add(node);
      for (String neighbor : graph.getOrDefault(node, List.of())) {
        if (visited.add(neighbor)) queue.add(neighbor);
      }
    }
    return order;
  }
}` },
  { id: 'c', label: 'C', executable: false, template: `#include <stdio.h>

int main(void) {
  printf("Polaris C workspace ready\\n");
  return 0;
}` },
  { id: 'cpp', label: 'C++', executable: false, template: `#include <iostream>
#include <queue>
using namespace std;

int main() {
  cout << "Polaris C++ workspace ready" << endl;
  return 0;
}` },
  { id: 'go', label: 'Go', executable: false, template: `package main

import "fmt"

func main() {
  fmt.Println("Polaris Go workspace ready")
}` },
  { id: 'rust', label: 'Rust', executable: false, template: `fn main() {
    println!("Polaris Rust workspace ready");
}` },
  { id: 'kotlin', label: 'Kotlin', executable: false, template: `fun main() {
    println("Polaris Kotlin workspace ready")
}` },
  { id: 'swift', label: 'Swift', executable: false, template: `print("Polaris Swift workspace ready")` },
  { id: 'sql', label: 'SQL', executable: false, template: `SELECT title, priority, due_date
FROM tasks
WHERE status <> 'Completed'
ORDER BY due_date ASC;` },
  { id: 'html', label: 'HTML', executable: false, template: `<!doctype html>
<html>
  <body>
    <h1>Polaris HTML workspace</h1>
  </body>
</html>` },
  { id: 'css', label: 'CSS', executable: false, template: `.polaris-card {
  border: 1px solid #e9e6df;
  border-radius: 8px;
  padding: 1rem;
}` },
  { id: 'bash', label: 'Bash', executable: false, template: `#!/usr/bin/env bash
echo "Polaris Bash workspace ready"` }
];

export default function CodingHub({ refreshData }) {
  const [languageId, setLanguageId] = useState('javascript');
  const [code, setCode] = useState(languages[0].template);
  
  const [outputTitle, setOutputTitle] = useState('Terminal Output');
  const [consoleLogs, setConsoleLogs] = useState('Polaris Coding Sandbox compiler ready. Load code template or write a script above.');
  const [working, setWorking] = useState(false);
  const [aiError, setAiError] = useState('');
  const selectedLanguage = languages.find(language => language.id === languageId) || languages[0];

  // DSA Card Lists
  const dsaPatterns = [
    {
      title: "BFS Graph Search",
      complexity: "O(V + E) Time / O(V) Space",
      desc: "Uses a FIFO Queue. Visited set prevents cycles. Ideal for shortest-path routing in unweighted grids.",
      demoCode: `function bfs(graph, start) {
  const visited = new Set();
  const queue = [start];
  visited.add(start);

  while (queue.length > 0) {
    const curr = queue.shift(); // FIFO
    for (let neighbor of graph[curr] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}`
    },
    {
      title: "DFS Recursion / Stack",
      complexity: "O(V + E) Time / O(V) Space",
      desc: "Uses LIFO Stack (recursion). Explores nodes in depth. Ideal for puzzle solving, backtracking, and topological sorting.",
      demoCode: `function dfs(graph, node, visited = new Set()) {
  visited.add(node);
  for (let neighbor of graph[node] || []) {
    if (!visited.has(neighbor)) {
      dfs(graph, neighbor, visited);
    }
  }
}`
    },
    {
      title: "Two Pointers Strategy",
      complexity: "O(N) Time / O(1) Space",
      desc: "Iterate using left/right boundary indexes. Best for sorting lists, reversing arrays, and partitioning elements.",
      demoCode: `function hasTargetSum(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    let sum = arr[left] + arr[right];
    if (sum === target) return true;
    if (sum < target) left++;
    else right--;
  }
  return false;
}`
    }
  ];

  const handleAction = async (type) => {
    setWorking(true);
    setAiError('');
    setConsoleLogs('Polaris is analyzing your code...');

    const actionMap = { debug: 'debug', explain: 'explain', dsa: 'dsa' };
    const titleMap = {
      debug: '🐞 Debugger Analysis',
      explain: '📝 Logic Breakdown',
      dsa: '💻 DSA Problem Generator'
    };

    try {
      const result = await apiJson('/api/ai/hub', {
        method: 'POST',
        body: JSON.stringify({
          agent: 'coding',
          action: actionMap[type],
          payload: { code, language: selectedLanguage.label }
        })
      });
      setOutputTitle(titleMap[type] || 'AI Response');
      setConsoleLogs(result.text || 'No response returned.');
    } catch (err) {
      console.error('Coding AI action failed:', err);
      setAiError(err.message || 'Polaris coding assistant is unavailable.');
      setOutputTitle('Polaris Unavailable');
      setConsoleLogs(err.message || 'Polaris could not inspect this snippet. Try again with a smaller example.');
    } finally {
      setWorking(false);
    }
  };

  const handleLanguageChange = (nextLanguageId) => {
    const nextLanguage = languages.find(language => language.id === nextLanguageId) || languages[0];
    setLanguageId(nextLanguage.id);
    setCode(nextLanguage.template);
    setOutputTitle('Terminal Output');
    setConsoleLogs(`${nextLanguage.label} mode loaded. ${nextLanguage.executable ? 'Execution is available in-browser for JavaScript.' : 'Editing and syntax-oriented assistance are available; execution is not configured for this language yet.'}`);
  };

  const handleRunCode = () => {
    setWorking(true);
    setOutputTitle(`${selectedLanguage.label} Execution`);

    if (!selectedLanguage.executable) {
      setConsoleLogs(`${selectedLanguage.label} execution is not available in this local browser sandbox.\n\nYou can still edit, load templates, debug, and ask Polaris to explain the code. JavaScript is currently executable here.`);
      setWorking(false);
      return;
    }

    const logs = [];
    const originalLog = console.log;
    try {
      console.log = (...args) => logs.push(args.map(String).join(' '));
      // eslint-disable-next-line no-new-func
      new Function(code)();
      setConsoleLogs(logs.length ? logs.join('\n') : 'JavaScript ran successfully with no console output.');
    } catch (err) {
      setConsoleLogs(`Runtime error:\n${err.message}`);
    } finally {
      console.log = originalLog;
      setWorking(false);
    }
  };

  const loadTemplate = (demo) => {
    setCode(demo);
    setOutputTitle('Terminal Output');
    setConsoleLogs('Loaded DSA template. Click "Debug" or "Explain Logic" to test.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <header>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>💻 Coding Agent Sandbox</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Debug algorithm drafts, analyze runtimes, and inspect common Data Structure patterns.</p>
      </header>

      {/* Workspace Editor Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '2.5rem' }}>
        
        {/* Mock Code Editor Panel */}
        <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Code size={18} style={{ color: 'var(--primary)' }} />
              Active Code Editor
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedLanguage.label} mode</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={languageId}
              onChange={(event) => handleLanguageChange(event.target.value)}
              style={{ flex: '1 1 180px' }}
            >
              {languages.map(language => (
                <option key={language.id} value={language.id}>{language.label}</option>
              ))}
            </select>
            <span className="badge">
              {selectedLanguage.executable ? 'Execution supported' : 'Editing only'}
            </span>
          </div>

          {/* Styled Editor Box */}
          <div style={{ position: 'relative', border: '1px solid var(--panel-border)', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Header bar */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--panel-border)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }}></span>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }}></span>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }}></span>
            </div>
            
            <textarea
              value={code}
              spellCheck="false"
              aria-label={`${selectedLanguage.label} code editor`}
              onChange={e => setCode(e.target.value)}
              style={{
                width: '100%',
                height: '280px',
                background: 'rgba(5, 5, 11, 0.65)',
                color: '#67e8f9', // Cyan monospace text
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '0.88rem',
                lineHeight: 1.6,
                padding: '1rem',
                border: 'none',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* Action trigger button strip */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => handleAction('debug')} 
              disabled={working}
              className="btn-secondary" 
              style={{ flex: 1, fontSize: '0.8rem', justifyContent: 'center' }}
            >
              <Bug size={14} style={{ color: 'var(--error)' }} />
              Debug Code
            </button>
            <button 
              onClick={() => handleAction('explain')} 
              disabled={working}
              className="btn-secondary" 
              style={{ flex: 1, fontSize: '0.8rem', justifyContent: 'center' }}
            >
              <HelpCircle size={14} style={{ color: 'var(--info)' }} />
              Explain Logic
            </button>
            <button 
              onClick={handleRunCode}
              disabled={working}
              className="glow-button" 
              style={{ flex: 1, fontSize: '0.8rem', justifyContent: 'center' }}
            >
              <Play size={14} />
              Run Code
            </button>
            <button 
              onClick={() => handleAction('dsa')} 
              disabled={working}
              className="glow-button" 
              style={{ flex: 1, fontSize: '0.8rem', justifyContent: 'center' }}
            >
              <Play size={14} />
              DSA Practice
            </button>
          </div>
        </section>

        {/* Console output Terminal panel */}
        <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={18} style={{ color: 'var(--secondary)' }} />
            <h3 style={{ fontSize: '1.1rem' }}>{outputTitle}</h3>
          </div>

          {aiError && (
            <div className="glass-card" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.75rem', borderLeft: '3px solid var(--error)' }}>
              <AlertCircle size={14} style={{ color: 'var(--error)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{aiError}</span>
            </div>
          )}

          <pre style={{
            flex: 1,
            background: 'rgba(0, 0, 0, 0.45)',
            border: '1px solid var(--panel-border)',
            borderRadius: '12px',
            padding: '1rem',
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: '0.82rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            minHeight: '345px'
          }}>
            {consoleLogs}
          </pre>
        </section>

      </div>

      {/* DSA Pattern Explorer widgets */}
      <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Code size={18} style={{ color: 'var(--accent)' }} />
          DSA Pattern Directory
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {dsaPatterns.map((pat, idx) => (
            <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{pat.title}</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>{pat.complexity}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{pat.desc}</p>
              
              <button 
                onClick={() => loadTemplate(pat.demoCode)}
                className="btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.6rem', marginTop: '0.5rem', alignSelf: 'flex-start' }}
              >
                Load Template
              </button>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
