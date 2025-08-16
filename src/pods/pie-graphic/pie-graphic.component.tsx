import React, { useEffect, useRef, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import "./pie-graphic.styles.scss";

// Register the required components from Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

interface ProcessedChartData {
  labels: string[];
  values: number[];
  colors: string[];
  originalRecordCount: number;
}

export const PieGraphic: React.FC = () => {
  const [chartData, setChartData] = useState<ProcessedChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalRecordCount, setOriginalRecordCount] = useState<number>(0);

  // State to cache processed chart data for each type
  //   const [cachedProcessedData, setCachedProcessedData] = useState<
  //     Partial<ProcessedChartData>
  //   >({});

  const workerRef = useRef<Worker | null>(null);

  // Function to send a message to the worker to load and process data
  const loadDataWithWorker = () => {
    // If not in cache, proceed to load from worker
    setLoading(true);
    setError(null);
    setChartData(null); // Clear previous chart data to show loading state
    setOriginalRecordCount(0);

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "loadData",
      });
    } else {
      console.error("Worker not initialized when trying to load data.");
      setError("Worker not ready. Please refresh the page.");
      setLoading(false);
    }
  };

  //
  useEffect(() => {
    // Initialize the Web Worker only once when the component mounts
    // and assign its event handlers.
    // NOTE: The `{ type: 'module' }` option is crucial for the worker to handle `import.meta.url`
    const worker = new Worker(
      new URL("../../workers/pie/data-processor-pie.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;

    // Listen for messages from the worker
    worker.onmessage = (event: MessageEvent) => {
      setLoading(false);
      if (event.data.type === "dataReady") {
        const receivedData: ProcessedChartData = {
          labels: event.data.labels,
          values: event.data.values,
          colors: event.data.colors,
          originalRecordCount: event.data.originalRecordCount,
        };
        setChartData(receivedData);
        setOriginalRecordCount(receivedData.originalRecordCount);
      } else if (event.data.type === "error") {
        setError(event.data.message);
      }
    };

    worker.onerror = (e) => {
      setLoading(false);
      setError(`Worker error: ${e.message}`);
      console.error("Worker error:", e);
    };

    // Clean up the worker when the component unmounts
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Define colors for the chart slices
  const COLORS = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
    "#B0E0E6",
    "#8A2BE2",
    "#DA70D6",
  ];

  // Data structure required by react-chartjs-2, derived from chartData state
  const data = chartData
    ? {
        labels: chartData.labels,
        datasets: [
          {
            label: "# of Records",
            data: chartData.values,
            backgroundColor: chartData.colors,
            borderColor: "#ffffff",
            borderWidth: 2,
          },
        ],
      }
    : null;

  // Options for the chart
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem: any) {
            const label = tooltipItem.label || "";
            const value = tooltipItem.raw;
            const total =
              chartData?.values.reduce((sum, val) => sum + val, 0) || 1;
            const percentage = ((value / total) * 100).toFixed(2);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  console.log("chartData", chartData, originalRecordCount, error, loading);
  return (
    <div className="rootPieGraphic">
      <button onClick={() => loadDataWithWorker()}>Click me</button>

      <div className="containerPie">
        {loading && (
          <p className="text-xl text-gray-500 animate-pulse">Loading data...</p>
        )}
        {error && <p className="text-red-500">Error: {error}</p>}
        {chartData && data ? (
          <>
            <div className="relative h-[400px]">
              <Pie data={data} options={options} />
            </div>
            <p className="text-center text-gray-600 mt-6">
              Visualizando un total de{" "}
              <span className="font-semibold">
                {originalRecordCount.toLocaleString()}
              </span>{" "}
              registros.
            </p>
          </>
        ) : (
          <button
            onClick={loadDataWithWorker}
            className="mt-4 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors"
          >
            Load Data
          </button>
        )}
      </div>
    </div>
  );
};
