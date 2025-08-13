import React, { useState } from 'react';
import { AppState } from '../../state/state';

const DOC_ALIASES = {
  SUSPENSION_DOC: 'Suspensions_and_permanent_exclusions_guidance',
  BEHAVIOUR_DOC: 'Behaviour in schools - advice for headteachers and school staff_Feb_2024',
  SEND_DOC: 'SEND_Code_of_Practice_January_2015'
};

export function RagAnalysisStep({ state, setState }: { state: AppState; setState: (s: AppState) => void }): JSX.Element {
  const [notes, setNotes] = useState('');

  function runRag(): void {
    // Placeholder: in a real app, call server with RAG over PDFs in /documents and optional school policy URL content
    const usedDocs: string[] = [DOC_ALIASES.SUSPENSION_DOC, DOC_ALIASES.BEHAVIOUR_DOC];
    if (state.isSend) usedDocs.push(DOC_ALIASES.SEND_DOC);

    // Minimal heuristic placeholding breaches; the assistant should ask for more info where unsure
    const breaches: string[] = [];
    if ((state.exclusionReason || '').toLowerCase().includes('ability') || (state.exclusionReason || '').toLowerCase().includes('attainment')) {
      breaches.push('Guidance: Unlawful to exclude for academic attainment/ability.');
    }
    if (state.isSend) {
      breaches.push('Consider SEND Code of Practice duties re: reasonable adjustments and support.');
    }
    if (!state.exclusionLetterDate) {
      breaches.push('Missing date of headteacher letter may indicate procedural defect.');
    }

    setState({ ...state, potentialBreaches: breaches, usedDocuments: Array.from(new Set([...(state.usedDocuments ?? []), ...usedDocs])) });
    setNotes('If uncertain, we will ask for more details in the next steps.');
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-semibold tracking-wide uppercase">RAG analysis</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">We will review statutory guidance and highlight potential breaches. This is a placeholder for an on-device/open-source model with retrieval.</p>

      <div className="grid gap-2 text-sm">
        <div><span className="font-semibold">Documents considered:</span> {(state.usedDocuments ?? []).join(', ') || '—'}</div>
        <div><span className="font-semibold">Potential breaches:</span> {(state.potentialBreaches ?? []).join(' | ') || '—'}</div>
        {notes && <div className="text-xs text-gray-500">{notes}</div>}
      </div>

      <div>
        <button className="btn btn-primary" onClick={runRag}>Run analysis</button>
      </div>
    </div>
  );
}


