import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Haven error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-primary, #fff)' }}>
          <h2>Something went wrong</h2>
          <p style={{ opacity: 0.6, marginTop: '0.5rem', fontSize: '0.875rem' }}>
            {this.state.error.message}
          </p>
          <button
            className="button secondary"
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: '1.5rem' }}
            type="button"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
