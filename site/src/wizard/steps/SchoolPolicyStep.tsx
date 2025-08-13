import React, { useState } from 'react';
import { AppState } from '../../state/state';

type PolicyResult = { title: string; url: string; snippet?: string };

export function SchoolPolicyStep({ state, setState }: { state: AppState; setState: (s: AppState) => void }): JSX.Element {
  const [results, setResults] = useState<PolicyResult[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function search(): Promise<void> {
    setLoading(true);
    // Stubbed search; integrate a web search API on the server in future
    const school = state.schoolName?.trim();
    if (!school) {
      setResults([]);
      setLoading(false);
      return;
    }
    // Heuristic dummy results
    const q = encodeURIComponent(`${school} equality policy aims objectives`);
    const base = `https://www.google.com/search?q=${q}`;
    setResults([
      { title: `${school} Equality Policy`, url: base, snippet: 'Equality information and objectives.' },
      { title: `${school} Accessibility & Equalities`, url: base, snippet: 'Public sector equality duty statement.' },
    ]);
    setLoading(false);
  }

  function confirm(): void {
    const picked = selected != null ? results[selected] : undefined;
    if (picked) {
      // For now, just store the URL; a backend would fetch and store the page content
      setState({ ...state, usedDocuments: Array.from(new Set([...(state.usedDocuments ?? []), `School policy: ${picked.url}`])) });
    }
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-semibold tracking-wide uppercase">School equality policy</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">We will try to find the school's equality policy or objectives. You may skip if not sure.</p>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="grid gap-1">
            <span className="text-xs uppercase tracking-wider">School name</span>
            <input className="input" value={state.schoolName ?? ''} onChange={e => setState({ ...state, schoolName: e.target.value })} placeholder="Optional" />
          </label>
        </div>
        <button className="btn" onClick={search} disabled={loading || !state.schoolName}>Search</button>
      </div>

      {loading && <div className="text-sm">Searching…</div>}

      {results.length > 0 && (
        <div className="grid gap-2">
          {results.map((r, i) => (
            <label key={r.url} className="border p-3 cursor-pointer flex gap-3 items-start">
              <input type="radio" name="policy" checked={selected === i} onChange={() => setSelected(i)} />
              <div>
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-gray-500 break-all">{r.url}</div>
                {r.snippet && <div className="text-sm text-gray-600 dark:text-gray-300">{r.snippet}</div>}
              </div>
            </label>
          ))}
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={confirm} disabled={selected == null}>Confirm</button>
            <button className="btn" onClick={() => { setResults([]); setSelected(null); }}>Skip</button>
          </div>
        </div>
      )}
    </div>
  );
}


