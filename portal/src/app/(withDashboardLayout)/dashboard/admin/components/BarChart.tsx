"use client";

import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { axisOptions, baseOptions, useChartColors } from "./useChartColors";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const monthLabel = (m: string) => new Date(m).toLocaleString("default", { month: "short", year: "2-digit", timeZone: "UTC" });

//* data: [{ month, count }]; `label` names the series. Colours follow light/dark mode.
const BarChart = ({ data, label = "Monthly Counts", integer = true }: { data?: any[]; label?: string; integer?: boolean }) => {
  const c = useChartColors();
  const rows = data ?? [];

  const chartData = {
    labels: rows.map((item) => monthLabel(item.month)),
    datasets: [
      {
        label,
        data: rows.map((item) => item.count),
        backgroundColor: c.series[0],
        borderRadius: 6,
      },
    ],
  };

  return <Bar key={c.scheme} data={chartData} options={baseOptions(c, { scales: axisOptions(c, integer) })} />;
};

export default BarChart;
