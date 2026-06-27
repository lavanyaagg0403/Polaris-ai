import React, { useState, useEffect } from 'react';
import { BookOpen, HelpCircle, Copy, Check, Trash2, Plus, Sparkles } from 'lucide-react';
import { apiFetch } from '../lib/api';

export default function StudyHub({ refreshData }) {
  const [notes, setNotes] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [activeDeck, setActiveDeck] = useState('dsa-graphs');
  const [currentFlashIndex, setCurrentFlashIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Notes Form State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  
  // Flashcard Form State
  const [flashQ, setFlashQ] = useState('');
  const [flashA, setFlashA] = useState('');
  
  // Quiz State
  const [quizScore, setQuizScore] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const quizQuestions = [
    {
      id: 'q1',
      question: "Which data structure is typically used to implement Breadth-First Search (BFS)?",
      options: ["Stack", "Queue", "Min-Heap", "Set"],
      answer: 1 // Queue
    },
    {
      id: 'q2',
      question: "What is the time complexity of Breadth-First Search (BFS) and Depth-First Search (DFS) on a graph with V vertices and E edges?",
      options: ["O(V * E)", "O(V^2)", "O(V + E)", "O(log V)"],
      answer: 2 // O(V + E)
    },
    {
      id: 'q3',
      question: "In standard Transformers (Vaswani et al., 2017), what component replaces recurrent networks (RNNs)?",
      options: ["Convolutions", "Self-Attention Mechanisms", "Feed-forward layers", "Max-pooling"],
      answer: 1 // Self-Attention
    }
  ];

  const fetchStudyData = async () => {
    try {
      const notesRes = await apiFetch('/api/study/notes');
      if (notesRes.ok) setNotes(await notesRes.json());
      
      const flashRes = await apiFetch('/api/study/flashcards');
      if (flashRes.ok) setFlashcards(await flashRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudyData();
  }, []);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteTitle || !noteContent) return;
    try {
      const res = await apiFetch('/api/study/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: noteTitle, content: noteContent })
      });
      if (res.ok) {
        setNoteTitle('');
        setNoteContent('');
        fetchStudyData();
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await apiFetch(`/api/study/notes/${id}`, { method: 'DELETE' });
      fetchStudyData();
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFlashcard = async (e) => {
    e.preventDefault();
    if (!flashQ || !flashA) return;
    try {
      const res = await apiFetch('/api/study/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: flashQ, answer: flashA, deck_id: activeDeck })
      });
      if (res.ok) {
        setFlashQ('');
        setFlashA('');
        fetchStudyData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFlashcard = async (id) => {
    try {
      await apiFetch(`/api/study/flashcards/${id}`, { method: 'DELETE' });
      fetchStudyData();
      if (currentFlashIndex > 0) setCurrentFlashIndex(prev => prev - 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuizAnswer = (qId, optionIdx) => {
    setQuizAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleQuizSubmit = () => {
    let score = 0;
    quizQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.answer) score++;
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const handleQuizReset = () => {
    setQuizAnswers({});
    setQuizScore(null);
    setQuizSubmitted(false);
  };

  // Filter flashcards by active deck
  const filteredFlashcards = flashcards.filter(f => f.deck_id === activeDeck);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <header>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>📚 Study Agent Workspace</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Review lecture summaries, build recall flashcard decks, and take micro-quizzes.</p>
      </header>

      {/* Main split grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Left Column: Flashcards & Quizzes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Flashcard segment */}
          <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} style={{ color: 'var(--accent)' }} />
                Active Recall Flashcards
              </h3>
              
              {/* Deck selector options */}
              <select 
                value={activeDeck} 
                onChange={(e) => { setActiveDeck(e.target.value); setCurrentFlashIndex(0); setFlipped(false); }}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', color: 'var(--text-primary)', padding: '0.25rem 0.5rem', borderRadius: '6px' }}
              >
                <option value="dsa-graphs">DSA Graphs Deck</option>
                <option value="nlp-transformers">NLP Transformers</option>
                <option value="general">General Notes</option>
              </select>
            </div>

            {filteredFlashcards.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                {/* 3D-styled Interactive Flipper Card */}
                <div 
                  onClick={() => setFlipped(!flipped)}
                  style={{
                    perspective: '1000px',
                    width: '100%',
                    height: '180px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    textAlign: 'center',
                    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateY(180deg)' : 'none'
                  }}>
                    {/* Front of Card */}
                    <div style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1.5rem',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 500 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'block', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Question</span>
                        {filteredFlashcards[currentFlashIndex]?.question}
                      </div>
                    </div>

                    {/* Back of Card */}
                    <div style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1.5rem',
                      transform: 'rotateY(180deg)',
                      boxShadow: '0 8px 16px rgba(99, 102, 241, 0.05)'
                    }}>
                      <div style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 500 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', display: 'block', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Answer</span>
                        {filteredFlashcards[currentFlashIndex]?.answer}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation and deck controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Card {currentFlashIndex + 1} of {filteredFlashcards.length}
                  </span>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="btn-secondary" 
                      onClick={() => { setFlipped(false); setCurrentFlashIndex(prev => Math.max(0, prev - 1)); }}
                      disabled={currentFlashIndex === 0}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      Prev
                    </button>
                    <button 
                      className="btn-secondary" 
                      onClick={() => { setFlipped(false); setCurrentFlashIndex(prev => Math.min(filteredFlashcards.length - 1, prev + 1)); }}
                      disabled={currentFlashIndex === filteredFlashcards.length - 1}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      Next
                    </button>
                    <button 
                      onClick={() => handleDeleteFlashcard(filteredFlashcards[currentFlashIndex].id)} 
                      style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', color: 'var(--error)', borderRadius: '6px', padding: '0.4rem 0.6rem', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>No cards in this deck yet. Create one below!</p>
            )}

            {/* Quick add flashcard form */}
            <form onSubmit={handleAddFlashcard} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--panel-border)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Create New Flashcard</h4>
              <input 
                type="text" 
                placeholder="Question (e.g. What is DFS complexity?)" 
                value={flashQ}
                onChange={e => setFlashQ(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.6rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
              />
              <input 
                type="text" 
                placeholder="Answer (e.g. O(V + E))" 
                value={flashA}
                onChange={e => setFlashA(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.6rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
              />
              <button type="submit" className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.6rem', justifyContent: 'center' }}>
                <Plus size={14} /> Add Card
              </button>
            </form>

          </section>

          {/* Quiz Generator segment */}
          <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle size={18} style={{ color: 'var(--primary)' }} />
              Interactive Topic Quiz
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {quizQuestions.map((q, idx) => (
                <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {idx + 1}. {q.question}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {q.options.map((opt, optIdx) => {
                      const isSelected = quizAnswers[q.id] === optIdx;
                      const isCorrect = q.answer === optIdx;
                      let bg = 'rgba(255,255,255,0.02)';
                      let border = '1px solid var(--panel-border)';
                      if (isSelected) {
                        bg = 'rgba(99, 102, 241, 0.15)';
                        border = '1px solid var(--primary)';
                      }
                      if (quizSubmitted) {
                        if (isCorrect) {
                          bg = 'rgba(16, 185, 129, 0.15)';
                          border = '1px solid var(--success)';
                        } else if (isSelected) {
                          bg = 'rgba(239, 68, 68, 0.15)';
                          border = '1px solid var(--error)';
                        }
                      }
                      return (
                        <button
                          key={optIdx}
                          disabled={quizSubmitted}
                          onClick={() => handleQuizAnswer(q.id, optIdx)}
                          style={{
                            textAlign: 'left',
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            background: bg,
                            border: border,
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            cursor: quizSubmitted ? 'default' : 'pointer',
                            transition: 'var(--transition-smooth)'
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {quizSubmitted ? (
              <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text-primary)' }}>
                    Your Score: {quizScore} / {quizQuestions.length}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {quizScore === quizQuestions.length ? 'Perfect Score! Exceptional!' : 'Review the study guide for missing spots.'}
                  </span>
                </div>
                <button className="btn-secondary" onClick={handleQuizReset} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                  Retry Quiz
                </button>
              </div>
            ) : (
              <button 
                onClick={handleQuizSubmit} 
                className="glow-button" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', fontSize: '0.85rem', padding: '0.6rem' }}
              >
                Submit Answers
              </button>
            )}

          </section>

        </div>

        {/* Right Column: Lecture Notes Manager */}
        <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} style={{ color: 'var(--secondary)' }} />
            Lecture Summaries & Notes
          </h3>

          {/* Add note form */}
          <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--panel-border)', padding: '1rem', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Add Study Notes</h4>
            <input 
              type="text" 
              placeholder="Topic Title (e.g. Graph BFS Traversal)" 
              value={noteTitle}
              onChange={e => setNoteTitle(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.6rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
            />
            <textarea 
              placeholder="Write detailed notes here..." 
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              style={{ width: '100%', height: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.6rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', resize: 'none' }}
            />
            <button type="submit" className="glow-button" style={{ width: '100%', fontSize: '0.8rem', padding: '0.6rem', justifyContent: 'center' }}>
              <Plus size={14} /> Add Notes
            </button>
          </form>

          {/* Notes display listing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '500px', paddingRight: '0.25rem' }}>
            {notes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>No study notes saved. Write one above to trigger summarization.</p>
            ) : (
              notes.map(note => (
                <div key={note.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600 }}>{note.title}</h4>
                    <button 
                      onClick={() => handleDeleteNote(note.id)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {note.content}
                  </p>
                  
                  {/* Auto-summary indicator */}
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(99,102,241,0.04)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.08)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' }}>AI Summary</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{note.summary}</span>
                  </div>
                </div>
              ))
            )}
          </div>

        </section>

      </div>

    </div>
  );
}
