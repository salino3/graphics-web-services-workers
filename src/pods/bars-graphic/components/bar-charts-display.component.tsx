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
  dataType: "population" | "pets"; // New prop to indicate data type
}

export const BarChartDisplay: React.FC<BarChartDisplayProps> = ({
  labels,
  values,
  title,
  dataType, // Destructure the new dataType prop
}) => {
  // Determine dataset label and Y-axis title based on dataType
  const datasetLabel =
    dataType === "population" ? "Total Population (Persons)" : "Total Pets";
  const yAxisTitle =
    dataType === "population" ? "Number of Persons" : "Number of Pets";

  const data = {
    labels: labels, // These are now the country names
    datasets: [
      {
        label: datasetLabel, // Dynamic label for the dataset
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
        text: title, // Use the title passed from the parent component
      },
      tooltip: {
        callbacks: {
          title: function (context: any) {
            // Tooltip title will be the country name
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
              // Dynamic suffix for the value (persons or pets)
              label += dataType === "population" ? " persons" : " pets";
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
          text: "Country", // X-axis title is always "Country"
        },
      },
      y: {
        title: {
          display: true,
          text: yAxisTitle, // Dynamic Y-axis title based on dataType
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
