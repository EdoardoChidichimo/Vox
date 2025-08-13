import React from 'react';
import { AppState } from '../../state/state';

export function ReviewSynthesisStep({ state, setState }: { state: AppState; setState: (s: AppState) => void }): JSX.Element {
  function synthesise(): void {
    // Simple heuristics to extract exclusion reason from letter text
    const reason = state.exclusionLetterText?.match(/(?:reason|because)\s*(?:for|is|was)?\s*[:\-]?\s*(.+)/i)?.[1]?.slice(0, 240) ?? state.exclusionReason ?? '';
    const facts = state.interviewFacts?.trim() || '';
    const parents = state.parentsVersionOfEvents?.trim() || '';

    setState({
      ...state,
      exclusionReason: reason,
      factsSynthesised: facts,
      parentsVersionOfEvents: parents,
    });
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-semibold tracking-wide uppercase">Review & synthesise</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">We will prepare variables for the next step.</p>

      <div className="grid gap-2 text-sm">
        <div><span className="font-semibold">Exclusion reason:</span> {state.exclusionReason || '—'}</div>
        <div><span className="font-semibold">Facts:</span> {state.factsSynthesised || state.interviewFacts || '—'}</div>
        <div><span className="font-semibold">Parents' version of events:</span> {state.parentsVersionOfEvents || '—'}</div>
      </div>

      <div>
        <button className="btn btn-primary" onClick={synthesise}>Generate variables</button>
      </div>
    </div>
  );
}


