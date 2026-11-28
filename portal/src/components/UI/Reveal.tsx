"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ease } from "./Motion";

//* Fades and slides its children in the first time they scroll into view.
const Reveal = ({ children, delay = 0, y = 48 }: { children: ReactNode; delay?: number; y?: number }) => (
  <motion.div
    initial={{ opacity: 0, y, scale: 0.97 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 1.05, ease, delay: delay / 1000 + 0.05 }}
  >
    {children}
  </motion.div>
);

export default Reveal;
