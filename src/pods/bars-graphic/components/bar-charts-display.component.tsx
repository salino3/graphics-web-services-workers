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

// src/pods/bars-graphic/components/bar-charts-display.component.tsx
// ... (imports y register se mantienen)

export const BarChartDisplay: React.FC<BarChartDisplayProps> = ({
  labels,
  values,
  title, // Este título lo pasa el componente padre
}) => {
  const data = {
    labels: labels, // Ahora serán nombres de países
    datasets: [
      {
        label: "Total Population", // Etiqueta del dataset, no en millones si la pop es la cuenta
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
        text: title, // Usar el título pasado por props
      },
      tooltip: {
        callbacks: {
          title: function (context: any) {
            // Ahora el título del tooltip será el nombre completo del país
            return `Country: ${context[0].label}`;
          },
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              // Formatear la población
              label += new Intl.NumberFormat("en-US", {
                style: "decimal",
              }).format(context.parsed.y);
              label += " persons"; // O "people" para ser más general
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
          text: "Country", // Ahora es el nombre completo del país
        },
      },
      y: {
        title: {
          display: true,
          text: "Total Population (Persons)", // Título del eje Y más específico
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
