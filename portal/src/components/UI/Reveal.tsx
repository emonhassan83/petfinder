"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ease } from "./Motion";

//* Fades and slides its children in the first time they scroll into view.
const Reveal = ({ children, delay = 0, y = 24 }: { children: ReactNode; delay?: number; y?: number }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.12 }}
    transition={{ duration: 0.7, ease, delay: delay / 1000 }}
  >
    {children}
  </motion.div>
);

export default Reveal;
