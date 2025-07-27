import React, { useState, useEffect, useRef } from "react";
import { BarChartDisplay } from "./components/bar-charts-display.component";
import "./bars-graphic.styles.scss";

export const BarsGraphic: React.FC = () => {
  const [chartData, setChartData] = useState<{
    labels: string[];
    values: number[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalRecordCount, setOriginalRecordCount] = useState<number>(0);

  // Use useRef to store the worker instance so it doesn't get re-created on re-renders
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize the Web Worker only once when the component mounts
    workerRef.current = new Worker(
      new URL("../../workers/data-processor.ts", import.meta.url)
    );

    // Listen for messages from the worker
    workerRef.current.onmessage = (event: MessageEvent) => {
      setLoading(false);
      if (event.data.type === "dataReady") {
        setChartData({
          labels: event.data.labels,
          values: event.data.values,
        });
        setOriginalRecordCount(event.data.originalRecordCount);
      } else if (event.data.type === "error") {
        setError(event.data.message);
      }
    };

    // Handle errors from the worker
    workerRef.current.onerror = (e) => {
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

  const loadDataWithWorker = () => {
    setLoading(true);
    setError(null);
    setChartData(null);
    setOriginalRecordCount(0);

    const jsonPath = import.meta.env.BASE_URL + "data_persons.json";

    if (workerRef.current) {
      // Send a message to the worker to start processing
      // The path is relative to the public folder
      workerRef.current.postMessage({
        type: "loadData",
        payload: jsonPath,
      });
    }
  };

  return (
    <div className="AppContainer">
      <header className="App-header">
        <h1>Country Data Visualization with Web Workers</h1>
        <p>
          Click the button to load and process large dataset ($
          {originalRecordCount} records) using a Web Worker.
        </p>
        <button onClick={loadDataWithWorker} disabled={loading}>
          {loading ? "Processing Data..." : "Load Data & Show Chart"}
        </button>
      </header>

      <main className="App-main">
        {error && <p className="error-message">Error: {error}</p>}
        {loading && (
          <p>Loading and processing data. Your UI remains responsive!</p>
        )}
        {chartData && (
          <BarChartDisplay
            labels={chartData.labels}
            values={chartData.values}
            title={`Total Population per Country`}
          />
        )}
      </main>
    </div>
  );
};
