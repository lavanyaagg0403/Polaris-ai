import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, Plus, Sparkles, Check, Trash2, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { apiFetch, apiJson } from '../lib/api';

export default function CareerHub({ refreshData }) {
  const [applications, setApplications] = useState([]);
  
  // App Form State
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('Applied');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Resume Feed State
  const [resumeText, setResumeText] = useState('');
  const [resumeFeedback, setResumeFeedback] = useState(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [resumeError, setResumeError] = useState('');

  const [selectedCompany, setSelectedCompany] = useState('Microsoft');
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [loadingInterview, setLoadingInterview] = useState(false);
  const [interviewError, setInterviewError] = useState('');

  const fetchApps = async () => {
    try {
      const res = await apiFetch('/api/applications');
      if (res.ok) setApplications(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleCreateApp = async (e) => {
    e.preventDefault();
    if (!company || !role || !dueDate) return;
    try {
      const res = await apiFetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          role,
          status,
          resume_notes: notes || 'No notes added yet.',
          due_date: dueDate
        })
      });
      if (res.ok) {
        setCompany('');
        setRole('');
        setNotes('');
        setDueDate('');
        fetchApps();
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (app, nextStatus) => {
    try {
      await apiFetch(`/api/applications/${app.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...app, status: nextStatus })
      });
      fetchApps();
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteApp = async (id) => {
    try {
      await apiFetch(`/api/applications/${id}`, { method: 'DELETE' });
      fetchApps();
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText.trim()) return;
    setAnalyzingResume(true);
    setResumeError('');
    setResumeFeedback(null);
    try {
      const result = await apiJson('/api/ai/hub', {
        method: 'POST',
        body: JSON.stringify({
          agent: 'career',
          action: 'analyze_resume',
          payload: { resumeText }
        })
      });
      setResumeFeedback(result);
    } catch (err) {
      console.error('Resume analysis failed:', err);
      setResumeError(err.message || 'AI resume analysis is unavailable.');
    } finally {
      setAnalyzingResume(false);
    }
  };

  const loadInterviewQuestions = async (company) => {
    setLoadingInterview(true);
    setInterviewError('');
    setInterviewQuestions([]);
    try {
      const app = applications.find(a => (a.company || '').toLowerCase() === company.toLowerCase());
      const result = await apiJson('/api/ai/hub', {
        method: 'POST',
        body: JSON.stringify({
          agent: 'career',
          action: 'interview_questions',
          payload: { company, role: app?.role || 'Software Engineer Intern' }
        })
      });
      setInterviewQuestions(Array.isArray(result.questions) ? result.questions : []);
    } catch (err) {
      console.error('Interview questions failed:', err);
      setInterviewError(err.message || 'Could not load interview questions.');
    } finally {
      setLoadingInterview(false);
    }
  };

  useEffect(() => {
    loadInterviewQuestions(selectedCompany);
  }, [selectedCompany]);

  const getAppsByStatus = (col) => {
    return applications.filter(a => (a.status || '').toLowerCase() === col.toLowerCase());
  };

  const columns = ['Applied', 'Interviewing', 'Offered', 'Rejected'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <header>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>💼 Career & Application Tracker</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track internship logs, get instant resume optimization feedback, and solve mock interview questions.</p>
      </header>

      {/* Kanban Board */}
      <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={18} style={{ color: 'var(--primary)' }} />
            Internship Tracker Board
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{applications.length} tracked applications</span>
        </div>

        {/* Board Columns Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
          {columns.map(col => {
            const apps = getAppsByStatus(col);
            return (
              <div key={col} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '350px' }}>
                
                {/* Column header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{col}</span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.03)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                    {apps.length}
                  </span>
                </div>

                {/* Cards stack */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  {apps.map(app => (
                    <div key={app.id} className="glass-card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{app.company}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{app.role}</span>
                        </div>
                        <button onClick={() => handleDeleteApp(app.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{app.resume_notes}</p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.4rem', marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Calendar size={10} /> {app.due_date}
                        </span>
                        
                        {/* Status Mover Quick Controls */}
                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                          {col !== 'Applied' && (
                            <button onClick={() => handleUpdateStatus(app, 'Applied')} title="Move to Applied" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '4px', fontSize: '0.65rem', padding: '0.1rem 0.25rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>A</button>
                          )}
                          {col !== 'Interviewing' && (
                            <button onClick={() => handleUpdateStatus(app, 'Interviewing')} title="Move to Interview" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '4px', fontSize: '0.65rem', padding: '0.1rem 0.25rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>I</button>
                          )}
                          {col !== 'Offered' && (
                            <button onClick={() => handleUpdateStatus(app, 'Offered')} title="Move to Offer" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)', borderRadius: '4px', fontSize: '0.65rem', padding: '0.1rem 0.25rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>O</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>

        {/* Add job application form */}
        <form onSubmit={handleCreateApp} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--panel-border)', padding: '1rem', borderRadius: '12px', marginTop: '0.5rem' }}>
          <h4 style={{ width: '100%', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Add Internship Listing</h4>
          <input 
            type="text" 
            placeholder="Company (e.g. Microsoft)" 
            value={company}
            onChange={e => setCompany(e.target.value)}
            style={{ flex: '1 1 180px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
          />
          <input 
            type="text" 
            placeholder="Role (e.g. SWE Intern)" 
            value={role}
            onChange={e => setRole(e.target.value)}
            style={{ flex: '1 1 180px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
          />
          <input 
            type="date" 
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={{ flex: '1 1 150px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
          />
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value)}
            style={{ flex: '1 1 120px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
          >
            <option value="Applied">Applied</option>
            <option value="Interviewing">Interviewing</option>
            <option value="Offered">Offered</option>
            <option value="Rejected">Rejected</option>
          </select>
          <input 
            type="text" 
            placeholder="Application notes..." 
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ flex: '2 1 250px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
          />
          <button type="submit" className="glow-button" style={{ fontSize: '0.8rem', padding: '0.5rem 1.25rem' }}>
            Add Application
          </button>
        </form>

      </section>

      {/* Grid: Resume Analyzer & Interview Prep */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>
        
        {/* Resume analysis widget */}
        <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} style={{ color: 'var(--secondary)' }} />
            AI Resume Feedback
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Paste your resume text below for immediate keyword checks and formatting gaps.</p>
          
          <textarea
            placeholder="Paste raw resume text here (e.g. Education, Projects, Skills...)"
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            style={{ width: '100%', height: '120px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.6rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', resize: 'none' }}
          />

          <button 
            onClick={handleAnalyzeResume} 
            disabled={analyzingResume || !resumeText.trim()}
            className="glow-button" 
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '0.6rem' }}
          >
            {analyzingResume ? 'Analyzing keywords...' : 'Analyze Resume'}
          </button>

          {resumeError && (
            <div className="glass-card" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderLeft: '3px solid var(--error)', padding: '0.75rem' }}>
              <AlertCircle size={14} style={{ color: 'var(--error)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{resumeError}</span>
            </div>
          )}

          {resumeFeedback && (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '3px solid var(--success)', background: 'rgba(16, 185, 129, 0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--success)' }}>Analysis Score: {resumeFeedback.score}/100</strong>
              </div>
              
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Strengths</span>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {(resumeFeedback.strengths || []).map((str, idx) => <li key={idx}>{str}</li>)}
                </ul>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Identified Gaps</span>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {(resumeFeedback.gaps || []).map((gp, idx) => <li key={idx} style={{ color: 'rgba(239, 68, 68, 0.85)' }}>{gp}</li>)}
                </ul>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Recommendation</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                  "{resumeFeedback.suggestions}"
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Company interview questions prep */}
        <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} style={{ color: 'var(--accent)' }} />
            Interview Practice Portal
          </h3>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['Microsoft', 'Google', 'Vercel'].map(comp => (
              <button
                key={comp}
                onClick={() => setSelectedCompany(comp)}
                style={{
                  background: selectedCompany === comp ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.02)',
                  border: selectedCompany === comp ? '1px solid var(--accent)' : '1px solid var(--panel-border)',
                  color: selectedCompany === comp ? 'var(--accent)' : 'var(--text-secondary)',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                {comp}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '350px' }}>
            {loadingInterview && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Generating interview questions…</p>
            )}
            {interviewError && (
              <div className="glass-card" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.75rem' }}>
                <AlertCircle size={14} style={{ color: 'var(--error)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>{interviewError}</span>
                <button className="btn-secondary" onClick={() => loadInterviewQuestions(selectedCompany)} style={{ fontSize: '0.75rem' }}>
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            )}
            {!loadingInterview && !interviewError && interviewQuestions.map((q, idx) => (
              <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>Q{idx + 1}: {q.q}</strong>
                <div style={{ borderLeft: '2px dashed var(--accent)', paddingLeft: '0.75rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>Preparational Advice</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{q.tips}</span>
                </div>
              </div>
            ))}
          </div>

        </section>

      </div>

    </div>
  );
}
