import React, { useState } from 'react';

type Step = { id: string; label: string };

export function Wizard({ steps, children }: { steps: Step[]; children: React.ReactNode[] }): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="grid gap-6">
      <nav aria-label="Progress" className="card p-4">
        <ol className="grid grid-cols-7 gap-2">
          {steps.map((step, index) => (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`w-full text-left px-3 py-2 border ${index === activeIndex ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-brand-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700'} uppercase text-xs tracking-wider`}
              >
                {index + 1}. {step.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <section className="card p-6">
        {children[activeIndex]}
        <div className="mt-6 flex justify-between">
          <button className="btn" disabled={activeIndex === 0} onClick={() => setActiveIndex(i => Math.max(0, i - 1))}>Back</button>
          <button className="btn btn-primary" disabled={activeIndex === children.length - 1} onClick={() => setActiveIndex(i => Math.min(children.length - 1, i + 1))}>Next</button>
        </div>
      </section>
    </div>
  );
}


