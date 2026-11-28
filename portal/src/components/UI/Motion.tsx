"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

//* Shared easing curve (matches the CSS animations in globals.css)
export const ease = [0.22, 1, 0.36, 1] as const;

//* Soft fade + rise used by route templates on every navigation.
export const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}>
    {children}
  </motion.div>
);

//* Spread onto an MUI element rendered as `component={motion.div}`: slides the auth form in from the right.
export const authFormMotion = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.6, ease, delay: 0.1 },
};
