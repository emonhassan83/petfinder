"use client";

import { useEffect, useState } from "react";

//* Chart.js draws on a canvas, so it cannot use var(--pf-*). Resolve the tokens at render time
//* and re-resolve whenever MUI flips the colour scheme attribute on <html>.
const ATTR = "data-mui-color-scheme";

export type ChartColors = {
  scheme: "light" | "dark";
  ink: string;
  slate: string;
  line: string;
  paper: string;
  series: string[];
};

const read = (): ChartColors => {
  const root = document.documentElement;
  const css = getComputedStyle(root);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const scheme = root.getAttribute(ATTR) === "dark" ? "dark" : "light";
  return {
    scheme,
    ink: v("--pf-ink", "#1e1b18"),
    slate: v("--pf-slate", "#6a625b"),
    line: v("--pf-line", "#eadfd2"),
    paper: v("--pf-paper", "#ffffff"),
    series: [v("--pf-primary", "#148f98"), v("--pf-accent", "#e8793a"), v("--pf-sunshine", "#ffc857"), v("--pf-rust", "#9a3a12"), v("--pf-primary-dark", "#0e6f77"), v("--pf-slate", "#6a625b")],
  };
};

const fallback: ChartColors = {
  scheme: "light",
  ink: "#1e1b18",
  slate: "#6a625b",
  line: "#eadfd2",
  paper: "#ffffff",
  series: ["#148f98", "#e8793a", "#ffc857", "#9a3a12", "#0e6f77", "#6a625b"],
};

export const useChartColors = (): ChartColors => {
  const [colors, setColors] = useState<ChartColors>(fallback);

  useEffect(() => {
    setColors(read());
    const observer = new MutationObserver(() => setColors(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [ATTR] });
    return () => observer.disconnect();
  }, []);

  return colors;
};

//* Shared Chart.js options so axes, grid, legend and tooltip follow the scheme.
export const baseOptions = (c: ChartColors, extra: Record<string, any> = {}) => ({
  maintainAspectRatio: false,
  color: c.ink,
  plugins: {
    legend: { labels: { color: c.ink } },
    tooltip: { backgroundColor: c.paper, titleColor: c.ink, bodyColor: c.ink, borderColor: c.line, borderWidth: 1 },
  },
  ...extra,
});

export const axisOptions = (c: ChartColors, integer = true) => ({
  x: { ticks: { color: c.slate }, grid: { color: c.line }, border: { color: c.line } },
  y: { beginAtZero: true, ticks: { color: c.slate, ...(integer ? { precision: 0 } : {}) }, grid: { color: c.line }, border: { color: c.line } },
});
