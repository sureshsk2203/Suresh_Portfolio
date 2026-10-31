import { useEffect, useRef, useState, type RefObject } from 'react';

interface CopyButtonProps {
  value: string;
  /** element whose text gets selected if the clipboard API is unavailable */
  selectRef: RefObject<HTMLElement | null>;
}

export default function CopyButton({ value, selectRef }: CopyButtonProps) {
  const [done, setDone] = useState(false);
  const timer = useRef<number | null>(null);

  const flash = () => {
    setDone(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 1400);
  };

  const fallback = () => {
    const el = selectRef.current;
    const sel = window.getSelection();
    if (el && sel) {
      const r = document.createRange();
      r.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(r);
    }
    flash();
  };

  const onClick = () => {
    try {
      navigator.clipboard.writeText(value).then(flash, fallback);
    } catch {
      fallback();
    }
  };

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  return (
    <button type="button" className="copy" onClick={onClick}>
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}
