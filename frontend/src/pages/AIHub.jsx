import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, Bot, Brain, CheckCircle, Compass, Copy, Play,
  RefreshCw, Send, Sparkles, Trash2, User
} from 'lucide-react';
import { apiJson } from '../lib/api';

const STORAGE_KEY = 'polaris.chat.localHistory';

const suggestions = [
  {
    title: 'Plan my week',
    text: "Help me prioritize my tasks and interviews for the next few days."
  },
  {
    title: 'Study strategy',
    text: 'What should I focus on today based on my pending work?'
  },
  {
    title: 'Interview prep',
    text: 'I have an upcoming interview — help me build a focused prep plan.'
  }
];

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const inlineMarkdown = (value = '') =>
  escapeHtml(value)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

const renderMarkdown = (markdown = '') => {
  const lines = String(markdown || '').split('\n');
  const html = [];
  let inList = false;
  let inCode = false;
  let code = [];
  let codeLang = '';

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  lines.forEach((line) => {
    const fence = line.match(/^```(\w+)?/);
    if (fence) {
      if (inCode) {
        html.push(`<pre><code class="language-${escapeHtml(codeLang)}">${escapeHtml(code.join('\n'))}</code></pre>`);
        code = [];
        codeLang = '';
        inCode = false;
      } else {
        closeList();
        codeLang = fence[1] || '';
        inCode = true;
      }
      return;
    }

    if (inCode) {
      code.push(line);
      return;
    }

    if (!line.trim()) {
      closeList();
      return;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length + 2, 4);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      return;
    }

    const listItem = line.match(/^\s*[-*]\s+(.*)$/) || line.match(/^\s*\d+\.\s+(.*)$/);
    if (listItem) {
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(listItem[1])}</li>`);
      return;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  });

  if (inCode) html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  closeList();
  return html.join('');
};

const normalizeMessage = (message) => ({
  id: message.id || `${Date.now()}-${Math.random()}`,
  query: message.query || message.text || '',
  plannerReasoning: message.plannerReasoning || message.planner_reasoning || '',
  agentLogs: Array.isArray(message.agentLogs) ? message.agentLogs : [],
  finalResponse: message.finalResponse || message.final_response || '',
  error: message.error || '',
  failed: Boolean(message.failed),
  created_at: message.created_at || new Date().toISOString()
});

const buildHistory = (messages) =>
  messages
    .filter(msg => !msg.pending && !msg.failed && msg.finalResponse)
    .flatMap(msg => [
      { role: 'user', content: msg.query },
      { role: 'assistant', content: msg.finalResponse }
    ])
    .slice(-12);

export default function AIHub({ refreshData, launch }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const handledLaunchRef = useRef(null);
  const messagesRef = useRef([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const data = await apiJson('/api/chat/history');
        const formatted = Array.isArray(data) ? data.reverse().map(normalizeMessage) : [];
        setMessages(formatted);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
      } catch (err) {
        console.error('Chat history unavailable:', err);
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          try {
            setMessages(JSON.parse(cached).map(normalizeMessage));
          } catch {
            setMessages([]);
          }
        }
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const sendMessage = useCallback(async (textToSend, { replaceId } = {}) => {
    const text = (textToSend ?? '').trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);
    setError('');

    const pendingId = replaceId || `pending-${Date.now()}`;
    const pending = {
      id: pendingId,
      query: text,
      plannerReasoning: 'Polaris is reading your request and choosing the right student agents.',
      agentLogs: [],
      finalResponse: '',
      pending: true,
      created_at: new Date().toISOString()
    };

    setMessages(prev => {
      if (replaceId) {
        return prev.map(msg => (msg.id === replaceId ? pending : msg));
      }
      return [...prev, pending];
    });

    const history = buildHistory(
      replaceId
        ? messagesRef.current.filter(msg => msg.id !== replaceId)
        : messagesRef.current
    );

    try {
      const result = normalizeMessage(await apiJson('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, history })
      }));
      setMessages(prev => prev.map(msg => (msg.id === pendingId ? result : msg)));
      refreshData?.();
    } catch (err) {
      console.error('Chat request failed:', err);
      const friendly = err.message || 'Polaris could not process that request. Please try again.';
      setError(friendly);
      setMessages(prev => prev.map(msg => (
        msg.id === pendingId
          ? {
              ...normalizeMessage({
                id: pendingId,
                query: text,
                error: friendly,
                failed: true,
                finalResponse: `### Polaris could not complete that request\n\n${friendly}\n\nTry again with a little more detail or refresh the dashboard data.`
              }),
              pending: false
            }
          : msg
      )));
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [loading, refreshData]);

  useEffect(() => {
    if (!launch || handledLaunchRef.current === launch.id) return;
    handledLaunchRef.current = launch.id;
    if (launch.prompt) setInput(launch.prompt);
    if (launch.focus) setTimeout(() => inputRef.current?.focus(), 50);
    if (launch.autoSend && launch.prompt) {
      setTimeout(() => sendMessage(launch.prompt), 80);
    }
  }, [launch, sendMessage]);

  const clearConversation = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const copyResponse = async (message) => {
    try {
      await navigator.clipboard.writeText(message.finalResponse || '');
      setCopiedId(message.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch (err) {
      setError('Copy failed. Select the response text and copy it manually.');
    }
  };

  const inputHelp = useMemo(() => (loading ? 'Polaris is thinking...' : 'Enter to send, Shift+Enter for newline'), [loading]);

  if (historyLoading && !hasMessages) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: '1rem' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--gold)' }} />
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem' }}>Loading Command Center…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateRows: '1fr auto', height: '88vh', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {!hasMessages && !loading && (
          <div style={{ margin: 'auto', maxWidth: '600px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)', padding: '1rem', borderRadius: '50%' }}>
                <Brain size={40} style={{ color: 'white' }} />
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Orchestrate Your Semester</h2>
              <p style={{ color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                Ask about your tasks, interviews, study plans, code, or research. Polaris remembers this conversation during your session.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(s.text)}
                  className="glass-card"
                  style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid var(--panel-border)', padding: '1rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: '0.2rem' }}>{s.title}</strong>
                    <span style={{ color: 'var(--ink-soft)' }}>"{s.text}"</span>
                  </div>
                  <Play size={14} style={{ color: 'var(--ink-muted)' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="glass-card" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderLeft: '3px solid var(--warning)', padding: '0.85rem' }}>
            <AlertCircle size={16} style={{ color: 'var(--warning)' }} />
            <span style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(201, 168, 76, 0.12)', border: '1px solid rgba(201, 168, 76, 0.22)', padding: '1rem', borderRadius: '16px 16px 0 16px', maxWidth: '70%' }}>
                <p style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>{msg.query}</p>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.8)', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} />
              </div>
            </div>

            {msg.pending ? (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', color: 'var(--ink-soft)' }}>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.9rem' }}>Polaris is thinking...</span>
              </div>
            ) : (
              <>
                {msg.plannerReasoning && (
                  <div className="glass-card" style={{ padding: '1.25rem', borderLeft: '3px solid var(--gold)', background: 'rgba(201,168,76,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Brain size={16} style={{ color: 'var(--gold)' }} />
                      <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--gold)' }}>Planner Routing Thought</strong>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', lineHeight: 1.5 }}>{msg.plannerReasoning}</p>
                  </div>
                )}

                {msg.agentLogs.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {msg.agentLogs.map((log, lidx) => (
                      <div key={lidx} className="glass-card" style={{ flex: '1 1 200px', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.75rem' }}>
                        <Bot size={16} style={{ color: 'var(--info)', marginTop: '0.1rem' }} />
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--ink)' }}>{log.agent || 'Polaris Agent'}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', display: 'block', marginTop: '0.2rem' }}>{log.action || 'Completed support work for this response.'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: msg.failed ? 'var(--error)' : 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Compass size={18} style={{ color: 'white' }} />
                  </div>
                  <div className="md-content" style={{ flex: 1, padding: '1rem', background: 'rgba(255,255,255,0.65)', border: `1px solid ${msg.failed ? 'rgba(139,32,32,0.25)' : 'var(--panel-border)'}`, borderRadius: '16px' }}>
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.finalResponse) }} />
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      {msg.failed && (
                        <button className="glow-button" onClick={() => sendMessage(msg.query, { replaceId: msg.id })} style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}>
                          <RefreshCw size={14} />
                          Retry
                        </button>
                      )}
                      {!msg.failed && (
                        <button className="btn-secondary" onClick={() => copyResponse(msg)} style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}>
                          {copiedId === msg.id ? <CheckCircle size={14} /> : <Copy size={14} />}
                          {copiedId === msg.id ? 'Copied' : 'Copy response'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask Polaris anything..."
            rows={Math.min(5, Math.max(2, input.split('\n').length))}
            style={{ flex: 1, background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '1rem 1.25rem', color: 'var(--ink)', fontSize: '0.95rem', outline: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', resize: 'vertical', minHeight: '54px', maxHeight: '150px' }}
            disabled={loading}
          />
          <button onClick={() => sendMessage(input)} className="glow-button" style={{ padding: '1rem', borderRadius: '12px' }} disabled={loading || !input.trim()} title="Send message">
            <Send size={18} />
          </button>
          <button onClick={clearConversation} className="btn-secondary" style={{ padding: '1rem', borderRadius: '12px' }} disabled={loading || !hasMessages} title="Clear conversation">
            <Trash2 size={18} />
          </button>
        </div>
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.75rem' }}>{inputHelp}</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
