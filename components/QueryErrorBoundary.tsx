"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
}

export default class QueryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="gt-error-box" style={{ textAlign: "center", padding: 18 }}>
          <p style={{ margin: 0 }}>{this.props.fallbackMessage ?? "Failed to load data."}</p>
          <button
            type="button"
            className="gt-btn gt-btn-outline"
            style={{ marginTop: 12 }}
            onClick={() => this.setState({ hasError: false })}
          >
            TRY AGAIN
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
