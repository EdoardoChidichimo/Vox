import React from 'react';
import { AppState, LanguageCode } from '../../state/state';

const languages: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'cy', label: 'Cymraeg' },
  { code: 'pl', label: 'Polski' },
  { code: 'ro', label: 'Română' },
  { code: 'ar', label: 'العربية' },
  { code: 'ur', label: 'اردو' },
];

export function LanguageStep({ state, setState }: { state: AppState; setState: (s: AppState) => void }): JSX.Element {
  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-semibold tracking-wide uppercase">Select your preferred language</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">We will use your selection throughout.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {languages.map(lang => (
          <button
            key={lang.code}
            className={`btn ${state.language === lang.code ? 'btn-primary' : ''}`}
            onClick={() => setState({ ...state, language: lang.code })}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}


