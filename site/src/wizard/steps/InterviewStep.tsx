import React, { useState } from 'react';
import { AppState } from '../../state/state';

export function InterviewStep({ state, setState }: { state: AppState; setState: (s: AppState) => void }): JSX.Element {
  const [local, setLocal] = useState({
    stage: state.stage ?? 'governors',
    governorsProcedureInfo: state.governorsProcedureInfo ?? '',
    interviewFacts: state.interviewFacts ?? '',
    parentsVersionOfEvents: state.parentsVersionOfEvents ?? ''
  });

  function commit(): void {
    setState({ ...state, ...local });
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-semibold tracking-wide uppercase">Interview</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">Tell us about the exclusion and procedure.</p>

      <div className="grid gap-3">
        <div className="grid gap-1">
          <span className="text-xs uppercase tracking-wider">Which stage are you at?</span>
          <div className="flex gap-3">
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="stage" checked={local.stage === 'governors'} onChange={() => setLocal({ ...local, stage: 'governors' })} />
              <span>Governing board (first stage)</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="stage" checked={local.stage === 'irp'} onChange={() => setLocal({ ...local, stage: 'irp' })} />
              <span>Independent Review Panel (second stage)</span>
            </label>
          </div>
        </div>

        {local.stage === 'irp' && (
          <label className="grid gap-1">
            <span className="text-xs uppercase tracking-wider">Tell us briefly about the governing board hearing procedure</span>
            <textarea className="input min-h-[100px]" value={local.governorsProcedureInfo} onChange={e => setLocal({ ...local, governorsProcedureInfo: e.target.value })} />
          </label>
        )}

        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-wider">Facts of the case</span>
          <textarea className="input min-h-[120px]" value={local.interviewFacts} onChange={e => setLocal({ ...local, interviewFacts: e.target.value })} />
        </label>

        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-wider">Parents' version of events</span>
          <textarea className="input min-h-[120px]" value={local.parentsVersionOfEvents} onChange={e => setLocal({ ...local, parentsVersionOfEvents: e.target.value })} />
        </label>
      </div>

      <div>
        <button className="btn btn-primary" onClick={commit}>Save</button>
      </div>
    </div>
  );
}


