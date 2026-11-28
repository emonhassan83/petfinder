"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { baseOptions, useChartColors } from "./useChartColors";

ChartJS.register(ArcElement, Tooltip, Legend);

//* data: [{ status, count }] (or set `labelKey`, e.g. "role"). Zero slices are dropped.
const PieChart = ({ data, labelKey = "status", label = "Distribution" }: { data?: any[]; labelKey?: string; label?: string }) => {
  const c = useChartColors();
  const rows = (data ?? []).filter((item) => item.count > 0);

  const chartData = {
    labels: rows.map((item) => String(item[labelKey]).replace(/_/g, " ")),
    datasets: [
      {
        label,
        data: rows.map((item) => item.count),
        backgroundColor: rows.map((_, i) => c.series[i % c.series.length]),
        borderColor: c.paper,
        borderWidth: 2,
      },
    ],
  };

  if (rows.length === 0) return <div style={{ color: c.slate, padding: 16 }}>No data yet.</div>;

  return <Doughnut key={c.scheme} data={chartData} options={baseOptions(c, { cutout: "55%" })} />;
};

export default PieChart;
