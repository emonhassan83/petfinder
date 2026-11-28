"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import { axisOptions, baseOptions, useChartColors } from "./useChartColors";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const monthLabel = (m: string) => new Date(m).toLocaleString("default", { month: "short", year: "2-digit", timeZone: "UTC" });

//* series: [{ label, data: [{ month, count }] }]; all series share the first one's months.
const LineChart = ({ series }: { series: { label: string; data: any[] }[] }) => {
  const c = useChartColors();
  const labels = (series[0]?.data ?? []).map((d) => monthLabel(d.month));

  const chartData = {
    labels,
    datasets: series.map((s, i) => ({
      label: s.label,
      data: s.data.map((d) => d.count),
      borderColor: c.series[i % c.series.length],
      backgroundColor: c.series[i % c.series.length],
      tension: 0.3,
      pointRadius: 3,
    })),
  };

  return <Line key={c.scheme} data={chartData} options={baseOptions(c, { scales: axisOptions(c) })} />;
};

export default LineChart;
