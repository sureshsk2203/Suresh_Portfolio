export type StepKind = 'school' | 'code' | 'figma' | 'photo' | 'car';

export interface Step {
  y: string;
  k: StepKind;
  t: string;
  d: string;
  now?: boolean;
}

export const STEPS: Step[] = [
  { y: '2021', k: 'school', t: 'Higher Secondary', d: 'P.L.W.A Higher Secondary School, V.K. Puram. Finished with 77%.' },
  { y: '2022', k: 'code', t: 'B.Sc. Computer Science', d: 'Joined St. Joseph College of Arts & Science, Tenkasi.' },
  { y: '2024', k: 'figma', t: 'UI/UX Certification', d: 'DesignSchool. Wireframes, prototypes, user flows and usability in Figma.' },
  { y: '2025', k: 'photo', t: 'Graduated', d: 'B.Sc. Computer Science, 78%, no arrears. Business, school and app projects shipped.' },
  { y: '2026', k: 'car', t: 'Growth Nest Tech Solution', d: 'UI/UX Designer & Full Stack Developer. Still building here.', now: true },
];

/** card artwork background per step (same order as STEPS) */
export const STEP_BG = [
  'linear-gradient(135deg,#3a1209,#120605)',
  'linear-gradient(135deg,#4a1d0a,#170807)',
  'linear-gradient(135deg,#2a0d14,#0d0508)',
  '#150a07',
  '#150a07',
];
