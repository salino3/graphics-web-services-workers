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
            return ` ${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  console.log("chartData", chartData, originalRecordCount);
  return (
    <div className="rootPieGraphic">
      <div className="buttonContainer">
        <button
          onClick={loadDataWithWorker}
          className="actionButton"
          disabled={loading || !!chartData?.values}
        >
          {loading ? "Loading..." : "Load data"}
        </button>
        <button
          className="clear"
          onClick={() => {
            setChartData(null);
            setError(null);
            setLoading(false);
            // NEW: Send message to worker to clear IndexDB
            if (workerRef.current) {
              workerRef.current.postMessage({ type: "clearData" });
            }
          }}
          disabled={loading || !chartData?.values}
        >
          Clear Data & IndexedDB
        </button>
      </div>

      <div className="containerPie">
        {loading && <p className="status-text">Loading data...</p>}
        {error && <p className="status-text error-text">Error: {error}</p>}
        {chartData && data ? (
          <>
            <div className="chart-wrapper">
              <Pie data={data} options={options} />
            </div>
            <p className="status-text record-count">
              Showing a total of{" "}
              <span>{originalRecordCount.toLocaleString()}</span> records.
            </p>
          </>
        ) : (
          <p className="status-text">Click "Load Data" to view the graphic.</p>
        )}
      </div>
    </div>
  );
};
