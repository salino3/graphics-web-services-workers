import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartDisplayProps {
  labels: string[];
  values: number[];
  title: string;
}

export const BarChartDisplay: React.FC<BarChartDisplayProps> = ({
  labels,
  values,
  title,
}) => {
  const data = {
    labels: labels,
    datasets: [
      {
        label: "Population (Millions)",
        data: values,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Country Initial Category",
        },
      },
      y: {
        title: {
          display: true,
          text: "Total Population",
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ width: "80%", margin: "auto" }}>
      <Bar data={data} options={options} />
    </div>
  );
};
