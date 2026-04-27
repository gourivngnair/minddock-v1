import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(_: Error, info: ErrorInfo) {
    console.error('MindDock render error:', info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--paper)' }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div className="serif" style={{ fontWeight: 500, fontSize: 18, textAlign: 'center' }}>Something went wrong</div>
          <div style={{ color: 'var(--ink-muted)', fontSize: '0.78rem', textAlign: 'center', maxWidth: 280, fontFamily: 'monospace', background: '#fff', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', wordBreak: 'break-all', lineHeight: 1.5 }}>
            {this.state.error.message}
          </div>
          <button className="btn btn-primary" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
