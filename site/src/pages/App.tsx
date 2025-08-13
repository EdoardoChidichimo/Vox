import React, { useMemo, useState } from 'react';
import { Wizard } from '../wizard/Wizard';
import { LanguageStep } from '../wizard/steps/LanguageStep';
import { LetterStep } from '../wizard/steps/LetterStep';
import { SchoolPolicyStep } from '../wizard/steps/SchoolPolicyStep';
import { InterviewStep } from '../wizard/steps/InterviewStep';
import { ReviewSynthesisStep } from '../wizard/steps/ReviewSynthesisStep';
import { RagAnalysisStep } from '../wizard/steps/RagAnalysisStep';
import { PositionStatementStep } from '../wizard/steps/PositionStatementStep';
import { AppState, EmptyState } from '../state/state';

const steps = [
  { id: 'language', label: 'Language' },
  { id: 'letter', label: 'Exclusion letter' },
  { id: 'policy', label: 'School policy' },
  { id: 'interview', label: 'Interview' },
  { id: 'review', label: 'Review' },
  { id: 'rag', label: 'RAG' },
  { id: 'position', label: 'Position statement' },
] as const;

export default function App(): JSX.Element {
  const [state, setState] = useState<AppState>(EmptyState);

  const stepComponents = useMemo(() => [
    <LanguageStep key="language" state={state} setState={setState} />,
    <LetterStep key="letter" state={state} setState={setState} />,
    <SchoolPolicyStep key="policy" state={state} setState={setState} />,
    <InterviewStep key="interview" state={state} setState={setState} />,
    <ReviewSynthesisStep key="review" state={state} setState={setState} />,
    <RagAnalysisStep key="rag" state={state} setState={setState} />,
    <PositionStatementStep key="position" state={state} />
  ], [state]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-5xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-brand-600" />
            <div>
              <h1 className="text-xl font-bold tracking-wider uppercase">Vox</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">UK school exclusions assistant</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Wizard steps={steps as unknown as { id: string; label: string }[]}> 
          {stepComponents}
        </Wizard>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 mt-12">
        <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Vox
        </div>
      </footer>
    </div>
  );
}


