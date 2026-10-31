import type { StepKind } from '../data/steps';

/** Line icons used on the first three journey cards. */
export default function StepIcon({ kind }: { kind: StepKind }) {
  switch (kind) {
    case 'school':
      return (
        <svg className="ico" viewBox="0 0 24 24">
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z" />
        </svg>
      );
    case 'code':
      return (
        <svg className="ico" viewBox="0 0 24 24">
          <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
        </svg>
      );
    case 'figma':
      return (
        <svg className="ico" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M3 15l6-6 4 4 3-3 5 5" />
          <circle cx="16.5" cy="8" r="1.4" />
        </svg>
      );
    default:
      return null;
  }
}
