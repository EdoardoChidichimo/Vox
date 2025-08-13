import React, { useMemo } from 'react';
import { AppState } from '../../state/state';

type Proposal = {
  title: string;
  relevant_guidance: string[];
  relevant_excerpts: { content: string; reference: string }[];
  suggested_wordings?: Record<string, Record<string, string[]>>;
};

const proposalsData: Proposal[] = [
  {
    title: 'Exclusion for a non-disciplinary reason',
    relevant_guidance: ['<<SUSPENSION_DOC>>'],
    relevant_excerpts: [
      { content: 'Only the headteacher of a school can suspend or permanently exclude a pupil on disciplinary grounds.', reference: 'Paragraph 1, <<SUSPENSION_DOC>>' },
      { content: 'It would also be unlawful to exclude a pupil simply because they have SEN or a disability that the school feels it is unable to meet, or for a reason such as, academic attainment/ability; or the failure of a pupil to meet specific conditions before they are reinstated, such as to attend a reintegration meeting.', reference: 'Paragraph 20, <<SUSPENSION_DOC>>' },
      { content: 'Excluding children from school for non-disciplinary reasons is unlawful.', reference: 'Page 4, House of Commons Library Briefing Paper: Off-rolling in English schools.' },
    ],
    suggested_wordings: {
      conditions: {
        'If stated reason is non-disciplinary': [
          "The reason the headteacher gave in their letter of <<EXCLUSION_LETTER_DATE>> confirming <<CHILD_NAME>>'s exclusion was <<EXCLUSION_REASON>>.",
          'This is not a valid reason to exclude a young person as it is not a matter of discipline. It does not relate to a breach of the school\'s behaviour policy. Therefore, it is not within the headteacher\'s lawful powers to exclude <<CHILD_NAME>> as a result of this incident. Excluding due to a non-disciplinary reason is a form off-rolling and it is unlawful. The headteacher has therefore acted outside the scope of their lawful power and we ask the governors to reinstate <<CHILD_NAME>> with immediate effect.'
        ],
        'If stated reason is disciplinary but true reason is non-disciplinary': [
          "The reason the headteacher gave in their letter of <<EXCLUSION_LETTER_DATE>> confirming <<CHILD_NAME>>'s exclusion was <<EXCLUSION_REASON>>.",
          'However, the headteacher has said in the letter that <<QUOTE SHOWING ALTERNATIVE MOTIVATION>>.',
          'This reveals a motivation for the exclusion that is not reflected in the letter confirming the permanent exclusion. This is not a valid reason to exclude a young person as it is not a matter of discipline. It does not relate to a breach of the school\'s behaviour policy. Therefore, it is not within the headteacher\'s lawful powers to exclude <<CHILD_NAME>> as a result of this incident. The headteacher has therefore acted outside the scope of their lawful power and we ask the governors to reinstate <<CHILD_NAME>> with immediate effect.',
          'If the governors do not agree that this exclusion has not been imposed for non-disciplinary reasons, we ask the governors to keep in mind the principal of procedural fairness that justice must not just be done but be unequivocally seen to be done. Clearly, in this instance, the headteacher has expressed an alternative, unlawful, influence on their decision making and justice cannot been seen to be done, because the family can see that the headteacher\'s decision has been adversely influenced by inappropriate factors. Therefore, we still urge the governors to reinstate <<CHILD_NAME>>.'
        ]
      }
    }
  }
];

function substitute(template: string, state: AppState): string {
  return template
    .replaceAll('<<CHILD_NAME>>', state.childName ?? 'the child')
    .replaceAll('<<EXCLUSION_LETTER_DATE>>', state.exclusionLetterDate ?? '(date)')
    .replaceAll('<<EXCLUSION_REASON>>', state.exclusionReason ?? '(reason)');
}

export function PositionStatementStep({ state }: { state: AppState }): JSX.Element {
  const matches = useMemo(() => {
    const breaches = (state.potentialBreaches ?? []).join(' ').toLowerCase();
    const out: Proposal[] = [];
    for (const p of proposalsData) {
      if (breaches.includes('unlawful') || breaches.includes('academic') || breaches.includes('non-disciplinary')) {
        out.push(p);
      }
    }
    return out;
  }, [state.potentialBreaches]);

  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-semibold tracking-wide uppercase">Position statement</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">Below are grounds relevant to your case. The final layout will follow the Position Statement Template.</p>

      {matches.length === 0 && (
        <div className="text-sm">No preset grounds matched. We recommend framing a ground based on your potential breaches and facts.</div>
      )}

      <div className="grid gap-6">
        {matches.map((p) => (
          <div key={p.title} className="border p-4">
            <div className="font-semibold">{p.title}</div>
            <div className="mt-2 text-sm">
              <div className="font-medium">Relevant guidance</div>
              <ul className="list-disc pl-6">
                {p.relevant_guidance.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
              <div className="font-medium mt-2">Relevant excerpts</div>
              <ul className="list-disc pl-6">
                {p.relevant_excerpts.map((e, idx) => (
                  <li key={idx}>
                    <span className="italic">“{e.content}”</span> — {e.reference}
                  </li>
                ))}
              </ul>
              {p.suggested_wordings && (
                <div className="mt-2">
                  <div className="font-medium">Suggested wordings (conditional)</div>
                  {Object.entries(p.suggested_wordings.conditions).map(([cond, lines]) => (
                    <div key={cond} className="mt-2">
                      <div className="text-xs uppercase text-gray-500">Condition: {cond}</div>
                      <ul className="list-disc pl-6">
                        {lines.map((ln, i) => (
                          <li key={i}>{substitute(ln, state)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


