import React, { useState } from 'react';
import { AppState } from '../../state/state';

export function LetterStep({ state, setState }: { state: AppState; setState: (s: AppState) => void }): JSX.Element {
  const [local, setLocal] = useState({
    parentName: state.parentName ?? '',
    childName: state.childName ?? '',
    exclusionDate: state.exclusionDate ?? '',
    exclusionLetterDate: state.exclusionLetterDate ?? '',
    schoolName: state.schoolName ?? '',
    exclusionLetterText: state.exclusionLetterText ?? '',
    isSend: state.isSend ?? false,
    isEthnicMinority: state.isEthnicMinority ?? false
  });

  function commit(): void {
    setState({ ...state, ...local });
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-semibold tracking-wide uppercase">Exclusion letter</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">Paste the text from the headteacher's letter confirming the exclusion. Do not upload a document.</p>

      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-wider">Parent's name</span>
          <input className="input" value={local.parentName} onChange={e => setLocal({ ...local, parentName: e.target.value })} />
        </label>

        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-wider">Child's name</span>
          <input className="input" value={local.childName} onChange={e => setLocal({ ...local, childName: e.target.value })} />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs uppercase tracking-wider">Date of exclusion</span>
            <input type="date" className="input" value={local.exclusionDate} onChange={e => setLocal({ ...local, exclusionDate: e.target.value })} />
          </label>
          <label className="grid gap-1">
            <span className="text-xs uppercase tracking-wider">Date of headteacher's letter</span>
            <input type="date" className="input" value={local.exclusionLetterDate} onChange={e => setLocal({ ...local, exclusionLetterDate: e.target.value })} />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-wider">School name (optional)</span>
          <input className="input" value={local.schoolName} onChange={e => setLocal({ ...local, schoolName: e.target.value })} placeholder="You may skip" />
        </label>

        <label className="grid gap-1">
          <span className="text-xs uppercase tracking-wider">Exclusion letter text</span>
          <textarea className="input min-h-[160px]" value={local.exclusionLetterText} onChange={e => setLocal({ ...local, exclusionLetterText: e.target.value })} />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={local.isSend} onChange={e => setLocal({ ...local, isSend: e.target.checked })} />
            <span className="text-sm">Child has SEND or is being assessed</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={local.isEthnicMinority} onChange={e => setLocal({ ...local, isEthnicMinority: e.target.checked })} />
            <span className="text-sm">Child is from an ethnic minority</span>
          </label>
        </div>
      </div>

      <div>
        <button className="btn btn-primary" onClick={commit}>Save</button>
      </div>
    </div>
  );
}


