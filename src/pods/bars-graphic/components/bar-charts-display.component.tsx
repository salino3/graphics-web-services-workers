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
  dataType: "population" | "pets" | "petsPercentage"; // Updated prop type
}

export const BarChartDisplay: React.FC<BarChartDisplayProps> = ({
  labels,
  values,
  title,
  dataType,
}) => {
  // Determine dataset label and Y-axis title based on dataType
  const datasetLabel =
    dataType === "population"
      ? "Total Population (Persons)"
      : dataType === "pets"
      ? "Total Pets"
      : "Percentage of Total Pets"; // New label for percentage

  const yAxisTitle =
    dataType === "population"
      ? "Number of Persons"
      : dataType === "pets"
      ? "Number of Pets"
      : "Percentage (%)"; // New Y-axis title for percentage

  const data = {
    labels: labels,
    datasets: [
      {
        label: datasetLabel,
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
      tooltip: {
        callbacks: {
          title: function (context: any) {
            return `Country: ${context[0].label}`;
          },
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              // Format the value based on dataType
              label += new Intl.NumberFormat("en-US", {
                style: "decimal",
              }).format(context.parsed.y);
              // Dynamic suffix for the value (persons, pets, or %)
              if (dataType === "population") {
                label += " persons";
              } else if (dataType === "pets") {
                label += " pets";
              } else if (dataType === "petsPercentage") {
                label += "%"; // Add percentage sign
              }
            }
            return label;
          },
        },
      },
    },

    scales: {
      x: {
        title: {
          display: true,
          text: "Countries",
        },
      },
      y: {
        title: {
          display: true,
          text: yAxisTitle, // Dynamic Y-axis title
        },
        beginAtZero: true,
        // For percentage chart, ensure Y-axis goes up to 100%
        max: dataType === "petsPercentage" ? 100 : undefined,
        ticks: {
          callback: function (value: any) {
            // Add '%' suffix to Y-axis ticks if it's a percentage chart
            return dataType === "petsPercentage"
              ? value + "%"
              : new Intl.NumberFormat("en-US", { style: "decimal" }).format(
                  value
                );
          },
        },
      },
    },
  };

  return (
    <div
      className="centerRow"
      style={{ maxHeight: "400px", width: "100%", margin: "auto" }}
    >
      <Bar data={data} options={options} />
    </div>
  );
};
