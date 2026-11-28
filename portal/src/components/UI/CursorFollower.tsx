"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { ease } from "./Motion";

const INTERACTIVE = "a, button, [role='button'], [role='radio'], input, textarea, select, label";

//* Soft ring that trails the mouse with a springy delay and swells over clickable things.
//* Desktop (fine pointer) only, skipped for reduced motion; the native cursor stays visible.
const CursorFollower = () => {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  //* Ring lags well behind; the dot follows almost instantly
  const ringX = useSpring(x, { stiffness: 140, damping: 18, mass: 0.7 });
  const ringY = useSpring(y, { stiffness: 140, damping: 18, mass: 0.7 });
  const dotX = useSpring(x, { stiffness: 900, damping: 45 });
  const dotY = useSpring(y, { stiffness: 900, damping: 45 });

  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      setHover(!!(e.target as Element | null)?.closest?.(INTERACTIVE));
    };
    const leave = () => setVisible(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [reduce, x, y]);

  if (!enabled) return null;

  const base = { position: "fixed", left: 0, top: 0, translateX: "-50%", translateY: "-50%", pointerEvents: "none", zIndex: 2000, borderRadius: "50%" } as const;

  return (
    <>
      <motion.div
        aria-hidden
        style={{ ...base, x: ringX, y: ringY, width: 38, height: 38, border: "1.5px solid var(--mui-palette-secondary-main)" }}
        animate={{ scale: hover ? 1.7 : 1, opacity: visible ? (hover ? 0.55 : 0.9) : 0 }}
        transition={{ duration: 0.35, ease }}
      />
      <motion.div
        aria-hidden
        style={{ ...base, x: dotX, y: dotY, width: 6, height: 6, background: "var(--mui-palette-secondary-main)" }}
        animate={{ scale: hover ? 0 : 1, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.25, ease }}
      />
    </>
  );
};

export default CursorFollower;
