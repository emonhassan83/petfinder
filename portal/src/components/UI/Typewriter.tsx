"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type TypePart = { text: string; wrap?: (children: ReactNode) => ReactNode };

//* Types its parts out one character at a time behind a blinking caret.
//* Untyped characters stay rendered (invisible) so the layout never jumps; screen readers get the full text at once.
const Typewriter = ({ parts, speed = 55, startDelay = 250 }: { parts: TypePart[]; speed?: number; startDelay?: number }) => {
  const reduce = useReducedMotion();
  const full = parts.map((p) => p.text).join("");
  const [n, setN] = useState(0);

  useEffect(() => {
    if (reduce) {
      setN(full.length);
      return;
    }
    setN(0);
    let i = 0;
    let tick: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      tick = setInterval(() => {
        i += 1;
        setN(i);
        if (i >= full.length && tick) clearInterval(tick);
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(start);
      if (tick) clearInterval(tick);
    };
  }, [full, speed, startDelay, reduce]);

  const caret = (
    <motion.span
      aria-hidden
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
      style={{ display: "inline-block", width: "0.06em", height: "0.85em", marginLeft: "0.04em", marginRight: "-0.1em", verticalAlign: "-0.06em", background: "currentColor", borderRadius: 2 }}
    />
  );

  let offset = 0;
  return (
    <>
      <span className="sr-only">{full}</span>
      <span aria-hidden>
        {parts.map((p, i) => {
          const shown = Math.max(0, Math.min(p.text.length, n - offset));
          const isLast = i === parts.length - 1;
          //* Caret sits inside the part currently being typed (or at the very end once finished)
          const hasCaret = (n >= offset && n < offset + p.text.length) || (isLast && n >= full.length);
          offset += p.text.length;
          const body = (
            <>
              {p.text.slice(0, shown)}
              {hasCaret && caret}
              <span style={{ visibility: "hidden" }}>{p.text.slice(shown)}</span>
            </>
          );
          return <span key={i}>{p.wrap ? p.wrap(body) : body}</span>;
        })}
      </span>
    </>
  );
};

export default Typewriter;
