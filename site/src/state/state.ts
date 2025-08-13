export type LanguageCode = 'en' | 'cy' | 'pl' | 'ro' | 'ar' | 'ur';

export type AppState = {
  language: LanguageCode;
  parentName?: string;
  childName?: string;
  schoolName?: string;
  isSend?: boolean;
  isEthnicMinority?: boolean;
  exclusionLetterText?: string;
  exclusionDate?: string;
  exclusionLetterDate?: string;
  exclusionReason?: string;
  stage?: 'governors' | 'irp';
  governorsProcedureInfo?: string;
  interviewFacts?: string;
  parentsVersionOfEvents?: string;
  factsSynthesised?: string;
  potentialBreaches?: string[];
  usedDocuments?: string[];
  positionStatement?: string;
};

export const EmptyState: AppState = {
  language: 'en',
};


