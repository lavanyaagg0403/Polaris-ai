import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`Polaris render error${this.props.label ? ` (${this.props.label})` : ''}:`, error, info);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem' }}>Something went off course.</h2>
        <p style={{ color: 'var(--ink-soft)', lineHeight: 1.6 }}>
          Polaris caught a screen error before it could go blank. You can retry this view or return home.
        </p>
        <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--error)', fontSize: '0.8rem' }}>
          {this.state.error.message}
        </pre>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="glow-button" onClick={() => this.setState({ error: null })}>Retry View</button>
          {this.props.onHome && (
            <button className="btn-secondary" onClick={this.props.onHome}>Go Home</button>
          )}
        </div>
      </div>
    );
  }
}
