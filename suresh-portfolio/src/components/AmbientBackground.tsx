import CursorGlow from './CursorGlow';
import './AmbientBackground.css';

/** Fixed decorative layers: cursor glow, film grain, and vignette. */
export default function AmbientBackground() {
  return (
    <>
      <CursorGlow />
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  );
}
