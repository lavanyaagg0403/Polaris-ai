import React, { useState, useEffect } from 'react';
import { User, RefreshCw, Database } from 'lucide-react';
import { apiFetch, apiJson } from '../lib/api';

const SectionLabel = ({ children }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '1rem',
    marginTop: '0.25rem'
  }}>
    <span style={{ color: '#c9a84c', fontSize: '0.7rem' }}>✦</span>
    <span style={{
      fontSize: '0.65rem',
      fontWeight: 600,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: '#8a9ab0'
    }}>{children}</span>
    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, #e9e6df, transparent)' }} />
  </div>
);

const inputStyle = {
  width: '100%',
  background: '#ffffff',
  border: '1px solid #ddd8ce',
  borderRadius: '8px',
  padding: '0.55rem 0.85rem',
  color: '#1a2535',
  fontSize: '0.875rem',
};

const labelStyle = {
  fontSize: '0.75rem',
  fontWeight: 500,
  color: '#5a6e82',
  display: 'block',
  marginBottom: '0.35rem',
};

export default function Settings({ refreshData }) {
  const [name, setName] = useState('');
  const [studyStyle, setStudyStyle] = useState('');
  const [careerGoals, setCareerGoals] = useState('');
  const [major, setMajor] = useState('');
  const [semester, setSemester] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await apiFetch('/api/memory');
      if (res.ok) {
        const mems = await res.json();
        mems.forEach(m => {
          if (m.key === 'student_name') setName(m.value);
          if (m.key === 'preferred_study_style') setStudyStyle(m.value);
          if (m.key === 'career_goals') setCareerGoals(m.value);
          if (m.key === 'major') setMajor(m.value);
          if (m.key === 'current_semester') setSemester(m.value);
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveMemory = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const save = async (key, val, cat) => {
        await apiFetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value: val, category: cat })
        });
      };
      await save('student_name', name, 'profile');
      await save('preferred_study_style', studyStyle, 'preference');
      await save('career_goals', careerGoals, 'career');
      await save('major', major, 'profile');
      await save('current_semester', semester, 'profile');
      setMessage('Memory updated. All agents re-synchronized.');
      refreshData();
    } catch (err) {
      console.error(err);
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('Reset Polaris to factory defaults? This clears tasks and chat histories.')) return;
    setResetting(true);
    setMessage('');
    try {
      await apiJson('/api/system/reset', { method: 'POST' });
      setMessage('Database reset complete. Reloading dashboard data.');
      await fetchSettings();
      refreshData();
    } catch (err) {
      console.error(err);
      setMessage('Failed to reset database.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '900px' }}>
      <header>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.75rem',
          fontWeight: 600,
          marginBottom: '0.35rem',
          color: '#0d1b2a'
        }}>
          Settings
        </h1>
        <p style={{ color: '#5a6e82', fontSize: '0.875rem', lineHeight: 1.6 }}>
          Manage your Student OS, AI agents, memory, and integrations.
        </p>
      </header>

      <div>
        <SectionLabel>Profile</SectionLabel>
        <section className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <User size={16} style={{ color: '#c9a84c' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1a2535' }}>Student Memory</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#8a9ab0', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            These facts are injected into every agent's context so Polaris always knows who you are and what you're working toward.
          </p>

          <form onSubmit={handleSaveMemory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Your Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Major / Field</label>
                <input type="text" value={major} placeholder="e.g. Computer Science" onChange={e => setMajor(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Current Semester</label>
              <input type="text" value={semester} placeholder="e.g. Fall 2026" onChange={e => setSemester(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Preferred Study Style</label>
              <input type="text" value={studyStyle} placeholder="e.g. Pomodoro with active recall" onChange={e => setStudyStyle(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Career & Internship Targets</label>
              <textarea
                value={careerGoals}
                placeholder="e.g. Secure a software engineering internship at a product startup..."
                onChange={e => setCareerGoals(e.target.value)}
                style={{ ...inputStyle, height: '80px', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button type="submit" className="glow-button" style={{ fontSize: '0.85rem' }} disabled={saving}>
                {saving ? 'Saving…' : 'Save Memory'}
              </button>
              {message && (
                <p style={{ fontSize: '0.8rem', color: message.includes('Failed') ? '#8b2020' : '#2a6b4a' }}>{message}</p>
              )}
            </div>
          </form>
        </section>
      </div>

      <div>
        <SectionLabel>System</SectionLabel>
        <section className="glass-panel" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Database size={16} style={{ color: '#8b2020' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1a2535' }}>Database Administration</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#8a9ab0', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Reset all tables to factory seed data. This permanently removes your tasks, chat history, and custom entries.
          </p>
          <button
            onClick={handleResetDatabase}
            disabled={resetting}
            className="btn-secondary"
            style={{
              borderColor: 'rgba(139, 32, 32, 0.2)',
              color: '#8b2020',
              fontSize: '0.85rem'
            }}
          >
            <RefreshCw size={14} />
            {resetting ? 'Resetting…' : 'Reset to Factory Defaults'}
          </button>
        </section>
      </div>
    </div>
  );
}
