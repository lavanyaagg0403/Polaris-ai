import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, Circle, AlertCircle, 
  TrendingUp, Calendar, ArrowRight, BookOpen, Brain, Briefcase,
  Compass, WifiOff, RefreshCw
} from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function Dashboard({ data, refreshData, loading, fetchError, setActiveTab, openCommandCenter }) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) { setTimedOut(false); return; }
    const t = setTimeout(() => setTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading) {
    if (timedOut) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: '1.5rem', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1.5px solid rgba(201,168,76,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(201,168,76,0.05)' }}>
            <WifiOff size={24} style={{ color: 'var(--gold, #c9a84c)', opacity: 0.7 }} />
          </div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', marginBottom: '0.5rem' }}>Backend Offline</h2>
            <p style={{ color: 'var(--ink-soft, #5a6e82)', fontSize: '0.875rem', maxWidth: '360px', lineHeight: 1.6 }}>
              Polaris is taking too long to connect. Make sure the backend is running with <code style={{ background: 'rgba(0,0,0,0.05)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.8rem' }}>npm run dev</code> inside the <strong>backend</strong> folder.
            </p>
          </div>
          <button
            className="glow-button"
            onClick={() => { setTimedOut(false); refreshData(); }}
            style={{ fontSize: '0.85rem' }}
          >
            <RefreshCw size={15} />
            Retry Connection
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: '1.25rem' }}>
        <div style={{
          width: '48px', height: '48px',
          border: '2px solid rgba(201,168,76,0.15)',
          borderTopColor: 'var(--gold, #c9a84c)',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite'
        }} />
        <p style={{ color: 'var(--ink-muted, #8a9ab0)', fontSize: '0.825rem', letterSpacing: '0.04em' }}>Connecting to Polaris…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: '1.5rem', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '1.5px solid rgba(201,168,76,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(201,168,76,0.05)' }}>
          <WifiOff size={24} style={{ color: 'var(--gold, #c9a84c)', opacity: 0.7 }} />
        </div>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', marginBottom: '0.5rem' }}>Backend Offline</h2>
          <p style={{ color: 'var(--ink-soft, #5a6e82)', fontSize: '0.875rem', maxWidth: '420px', lineHeight: 1.6 }}>
            {fetchError || 'Polaris cannot reach the backend server.'}
          </p>
        </div>
        <button className="glow-button" onClick={refreshData} style={{ fontSize: '0.85rem' }}>
          <RefreshCw size={15} />
          Retry Connection
        </button>
      </div>
    );
  }

  const tasks = data?.tasks || { total: 0, pending: 0, completed: 0, urgent: [] };
  const applications = data?.applications || { stats: [], recent: [] };
  const mood = Array.isArray(data?.mood) ? data.mood : [];
  const aiRecommendation = data?.aiRecommendation || 'Review your priorities and choose one focused next step for today.';
  const studentName = data?.studentName || 'Student';
  const studyProgress = typeof data?.studyProgress === 'number' ? data.studyProgress : 0;

  // Calculate status counts for applications
  const getAppCount = (status) => {
    const found = applications.stats.find(s => (s.status || '').toLowerCase() === status.toLowerCase());
    return found ? found.count : 0;
  };

  const handleToggleTask = async (task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await apiFetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, status: nextStatus })
      });
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === 'High') return 'var(--error)';
    if (priority === 'Medium') return 'var(--warning)';
    return 'var(--info)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <header className="glass-panel" style={{ padding: '2rem 2.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden', borderLeft: '3px solid var(--gold, #c9a84c)' }}>
        <div style={{ zIndex: 1 }}>
          <h1 style={{
            fontSize: '2.4rem',
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700,
            marginBottom: '0.4rem',
            color: 'var(--midnight, #0d1b2a)',
            letterSpacing: '-0.01em',
            lineHeight: 1.15
          }}>
            Welcome back, {studentName}
          </h1>
          <p style={{ color: 'var(--ink-soft, #5a6e82)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <Sparkles size={15} style={{ color: 'var(--gold, #c9a84c)', flexShrink: 0 }} />
            Polaris is active &mdash; your agents are synchronized with this semester.
          </p>
        </div>
        <button className="glow-button" onClick={() => openCommandCenter?.({ focus: true })} style={{ zIndex: 1, flexShrink: 0 }}>
          <span>Ask Polaris</span>
          <ArrowRight size={16} />
        </button>
        {/* Subtle gold orb accent */}
        <div style={{
          position: 'absolute',
          right: '-5%',
          top: '-40%',
          width: '260px',
          height: '260px',
          background: 'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
      </header>

      {/* Grid Dashboard Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Priority tasks widget */}
        <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} />
              Today's Priorities
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tasks.pending} pending</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '250px', paddingRight: '0.25rem' }}>
            {tasks.urgent.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>No high priority tasks today. Nice work!</p>
            ) : (
              tasks.urgent.map(task => (
                <div key={task.id} className="glass-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem' }}>
                  <button onClick={() => handleToggleTask(task)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '0.15rem' }}>
                    {task.status === 'Completed' ? 
                      <CheckCircle2 size={18} style={{ color: 'var(--success)' }} /> : 
                      <Circle size={18} />
                    }
                  </button>
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 500,
                      textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
                      color: task.status === 'Completed' ? 'var(--text-muted)' : 'var(--text-primary)'
                    }}>
                      {task.title}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: getPriorityColor(task.priority), background: 'rgba(255,255,255,0.03)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {task.priority} Priority
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Calendar size={10} /> {task.due_date}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* AI Recommendations widget */}
        <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(217, 70, 239, 0.04) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={18} style={{ color: 'var(--secondary)' }} />
            <h3 style={{ fontSize: '1.2rem' }}>AI Recommendations</h3>
          </div>
          <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', border: '1px dashed rgba(217, 70, 239, 0.2)' }}>
            <div className="pulsing-glow" style={{ padding: '0.5rem', borderRadius: '50%', background: 'rgba(217,70,239,0.1)', animation: 'pulse-glow 3s infinite' }}>
              <Sparkles size={24} style={{ color: 'var(--secondary)' }} />
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.5, textAlign: 'center', color: 'var(--text-primary)' }}>
              "{aiRecommendation}"
            </p>
            <button
              className="btn-secondary"
              onClick={() => openCommandCenter?.({
                prompt: `I'd like to discuss today's recommendations.\n\nRecommendation: ${aiRecommendation}`,
                autoSend: true,
                focus: true
              })}
              style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', marginTop: '0.5rem' }}
            >
              Deep Dive in Chat
            </button>
          </div>
        </section>

        {/* Application funnel stats widget */}
        <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Briefcase size={18} style={{ color: 'var(--accent)' }} />
              Application Tracker
            </h3>
            <span onClick={() => setActiveTab('career')} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              View Pipeline <ArrowRight size={12} />
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            {[
              { label: 'Applied', count: getAppCount('Applied'), color: 'var(--info)' },
              { label: 'Interview', count: getAppCount('Interviewing'), color: 'var(--warning)' },
              { label: 'Offers', count: getAppCount('Offered'), color: 'var(--success)' },
              { label: 'Rejected', count: getAppCount('Rejected'), color: 'var(--text-muted)' }
            ].map(col => (
              <div key={col.label} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem 0.25rem', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: col.color, display: 'block' }}>{col.count}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{col.label}</span>
              </div>
            ))}
          </div>

          {/* Mini pipeline progress */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Next Deadline</h4>
            {applications.recent.length > 0 ? (
              <div className="glass-card" style={{ padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{applications.recent[0].company}</strong>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>{applications.recent[0].role}</span>
                </div>
                <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>{applications.recent[0].due_date}</span>
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No application deadlines set.</p>
            )}
          </div>
        </section>
      </div>

      {/* Bottom Summary Indicators */}
      <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-around', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Progress Circle for study */}
          <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ transform: 'rotate(-90deg)', width: '60px', height: '60px' }}>
              <circle cx="30" cy="30" r="26" stroke="rgba(255,255,255,0.03)" strokeWidth="4" fill="transparent" />
              <circle cx="30" cy="30" r="26" stroke="var(--primary)" strokeWidth="4" fill="transparent" 
                strokeDasharray="163.36" strokeDashoffset={163.36 * (1 - studyProgress / 100)} 
                strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', fontSize: '0.85rem', fontWeight: 'bold' }}>{studyProgress}%</div>
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Study Progress</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Task completion rate</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Tasks circle */}
          <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ transform: 'rotate(-90deg)', width: '60px', height: '60px' }}>
              <circle cx="30" cy="30" r="26" stroke="rgba(255,255,255,0.03)" strokeWidth="4" fill="transparent" />
              <circle cx="30" cy="30" r="26" stroke="var(--secondary)" strokeWidth="4" fill="transparent" 
                strokeDasharray="163.36" 
                strokeDashoffset={tasks.total ? 163.36 * (1 - tasks.completed / tasks.total) : 163.36} 
                strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', fontSize: '0.85rem', fontWeight: 'bold' }}>
              {tasks.total ? Math.round((tasks.completed / tasks.total) * 100) : 0}%
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Tasks Completed</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{tasks.completed} of {tasks.total} finished</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Mood Widget */}
          <div style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '50%', width: '50px', height: '50px' }}>
            {(() => {
              if (mood.length === 0) return '😐';
              const lastMood = mood[0].score;
              if (lastMood >= 4) return '😊';
              if (lastMood === 3) return '😐';
              return '😫';
            })()}
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Wellness Status</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {mood.length > 0 ? `Current state: "${(mood[0].comment || '').substring(0, 30)}..."` : 'No mood logged today'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
