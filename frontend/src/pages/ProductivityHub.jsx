import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, Calendar, Clock, Smile, Trash2, Plus, Play, Pause, RotateCcw } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function ProductivityHub({ refreshData }) {
  const [tasks, setTasks] = useState([]);
  const [moods, setMoods] = useState([]);

  // Form Task State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskCategory, setTaskCategory] = useState('Study');

  // Mood form State
  const [moodScore, setMoodScore] = useState(3);
  const [moodComment, setMoodComment] = useState('');

  // Pomodoro Timer State
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState('Study'); // Study (25m), Break (5m)
  const timerRef = useRef(null);

  const fetchProdData = async () => {
    try {
      const taskRes = await apiFetch('/api/tasks');
      if (taskRes.ok) setTasks(await taskRes.json());
      
      const moodRes = await apiFetch('/api/mood');
      if (moodRes.ok) setMoods(await moodRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProdData();
  }, []);

  // Timer Tick implementation
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(prev => prev - 1);
        } else if (timerSeconds === 0) {
          if (timerMinutes === 0) {
            // Timer alarm
            handleTimerComplete();
          } else {
            setTimerMinutes(prev => prev - 1);
            setTimerSeconds(59);
          }
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [timerActive, timerMinutes, timerSeconds]);

  const handleTimerComplete = () => {
    setTimerActive(false);
    // Play beep or show notification
    alert(`${timerMode} session has ended! Take a moment.`);
    
    // Auto switch modes
    if (timerMode === 'Study') {
      setTimerMode('Break');
      setTimerMinutes(5);
    } else {
      setTimerMode('Study');
      setTimerMinutes(25);
    }
    setTimerSeconds(0);
  };

  const handleStartPause = () => {
    setTimerActive(!timerActive);
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setTimerMinutes(timerMode === 'Study' ? 25 : 5);
    setTimerSeconds(0);
  };

  const handleSetMode = (mode) => {
    setTimerActive(false);
    setTimerMode(mode);
    setTimerMinutes(mode === 'Study' ? 25 : 5);
    setTimerSeconds(0);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskTitle || !taskDueDate) return;
    try {
      const res = await apiFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          priority: taskPriority,
          due_date: taskDueDate,
          category: taskCategory,
          status: 'Pending'
        })
      });
      if (res.ok) {
        setTaskTitle('');
        setTaskDueDate('');
        fetchProdData();
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      await apiFetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, status: nextStatus })
      });
      fetchProdData();
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
      fetchProdData();
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMood = async (e) => {
    e.preventDefault();
    if (!moodComment) return;
    try {
      const res = await apiFetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: moodScore, comment: moodComment })
      });
      if (res.ok) {
        setMoodComment('');
        setMoodScore(3);
        fetchProdData();
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getMoodEmoji = (score) => {
    if (score >= 5) return '😊';
    if (score === 4) return '🙂';
    if (score === 3) return '😐';
    if (score === 2) return '😫';
    return '😭';
  };

  // Format time display helper
  const formatTime = (m, s) => {
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <header>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>📅 Productivity & Wellness</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your daily schedules, set Pomodoro timers, and check in on your stress levels.</p>
      </header>

      {/* Grid splits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>
        
        {/* Left Column: Pomodoro & Mood */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Pomodoro Timer widget */}
          <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start' }}>
              <Clock size={16} style={{ color: 'var(--primary)' }} />
              Pomodoro Focus Timer
            </h3>

            {/* Mode selection tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.1)', padding: '0.25rem', borderRadius: '8px' }}>
              <button 
                onClick={() => handleSetMode('Study')}
                style={{
                  background: timerMode === 'Study' ? 'var(--primary)' : 'transparent',
                  border: 'none',
                  color: timerMode === 'Study' ? 'white' : 'var(--text-secondary)',
                  padding: '0.4rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Study Session (25m)
              </button>
              <button 
                onClick={() => handleSetMode('Break')}
                style={{
                  background: timerMode === 'Break' ? 'var(--secondary)' : 'transparent',
                  border: 'none',
                  color: timerMode === 'Break' ? 'white' : 'var(--text-secondary)',
                  padding: '0.4rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Mindful Break (5m)
              </button>
            </div>

            {/* Giant Circular Countdown timer */}
            <div style={{
              position: 'relative',
              width: '180px',
              height: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '1rem 0'
            }}>
              <svg style={{ transform: 'rotate(-90deg)', width: '180px', height: '180px' }}>
                <circle cx="90" cy="90" r="82" stroke="rgba(255,255,255,0.02)" strokeWidth="6" fill="transparent" />
                <circle cx="90" cy="90" r="82" 
                  stroke={timerMode === 'Study' ? 'var(--primary)' : 'var(--secondary)'} 
                  strokeWidth="6" fill="transparent"
                  strokeDasharray="515.22"
                  strokeDashoffset={515.22 * (1 - (timerMinutes * 60 + timerSeconds) / (timerMode === 'Study' ? 1500 : 300))}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                  {formatTime(timerMinutes, timerSeconds)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', tracking: '0.1em' }}>
                  {timerActive ? 'Focus active' : 'Paused'}
                </span>
              </div>
            </div>

            {/* Timer action triggers */}
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button 
                onClick={handleStartPause} 
                className="glow-button" 
                style={{ flex: 2, justifyContent: 'center', background: timerMode === 'Study' ? 'var(--primary)' : 'var(--secondary)' }}
              >
                {timerActive ? <Pause size={16} /> : <Play size={16} />}
                {timerActive ? 'Pause' : 'Start Focus'}
              </button>
              <button 
                onClick={handleResetTimer} 
                className="btn-secondary" 
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

          </section>

          {/* Mood tracker log widget */}
          <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Smile size={16} style={{ color: 'var(--secondary)' }} />
              Mindfulness & Mood Journal
            </h3>

            {/* Mood button selection */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              {[1, 2, 3, 4, 5].map(score => (
                <button
                  key={score}
                  onClick={() => setMoodScore(score)}
                  style={{
                    fontSize: '1.75rem',
                    background: moodScore === score ? 'rgba(217, 70, 239, 0.15)' : 'transparent',
                    border: moodScore === score ? '1px solid var(--secondary)' : '1px solid transparent',
                    borderRadius: '50%',
                    width: '45px',
                    height: '45px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'var(--transition-smooth)'
                  }}
                  title={`Score: ${score}`}
                  type="button"
                >
                  {getMoodEmoji(score)}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddMood} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="How are you feeling? (e.g. A bit stressed about Friday...)"
                value={moodComment}
                onChange={e => setMoodComment(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.6rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
              />
              <button type="submit" className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.6rem', justifyContent: 'center' }}>
                Save Check-in
              </button>
            </form>

            {/* Recent logs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '180px', marginTop: '0.5rem' }}>
              {moods.slice(0, 4).map(m => (
                <div key={m.id} className="glass-card" style={{ padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.25rem' }}>{getMoodEmoji(m.score)}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{m.comment}</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.created_at.split('T')[0]}</span>
                </div>
              ))}
            </div>

          </section>

        </div>

        {/* Right Column: Tasks Checklist manager */}
        <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckSquare size={18} style={{ color: 'var(--accent)' }} />
              Academic Tasks Checklist
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {tasks.filter(t => t.status === 'Completed').length} / {tasks.length} Done
            </span>
          </div>

          {/* Quick add task inline form */}
          <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--panel-border)', padding: '1rem', borderRadius: '12px' }}>
            <input 
              type="text" 
              placeholder="Task Title (e.g. Graph BFS problems)" 
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.5rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <input 
                type="date" 
                value={taskDueDate}
                onChange={e => setTaskDueDate(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
              />
              <select 
                value={taskPriority} 
                onChange={e => setTaskPriority(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
            <select 
              value={taskCategory} 
              onChange={e => setTaskCategory(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.5rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}
            >
              <option value="Study">Study</option>
              <option value="Career">Career</option>
              <option value="Coding">Coding</option>
              <option value="Research">Research</option>
              <option value="Wellness">Wellness</option>
            </select>
            <button type="submit" className="glow-button" style={{ fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'center' }}>
              <Plus size={14} /> Add Checklist Task
            </button>
          </form>

          {/* Full checklist items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '420px', paddingRight: '0.25rem' }}>
            {tasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>No tasks found. Create a new task above!</p>
            ) : (
              tasks.map(task => (
                <div key={task.id} className="glass-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem' }}>
                  <input 
                    type="checkbox" 
                    checked={task.status === 'Completed'}
                    onChange={() => handleToggleTask(task)}
                    style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ 
                      fontSize: '0.88rem', 
                      fontWeight: 500, 
                      color: task.status === 'Completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: task.status === 'Completed' ? 'line-through' : 'none'
                    }}>
                      {task.title}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--panel-border)', padding: '0.1rem 0.3rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                        {task.category}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: task.priority === 'High' ? 'var(--error)' : task.priority === 'Medium' ? 'var(--warning)' : 'var(--info)' }}>
                        {task.priority}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                        <Calendar size={8} /> {task.due_date}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteTask(task.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

        </section>

      </div>

    </div>
  );
}
