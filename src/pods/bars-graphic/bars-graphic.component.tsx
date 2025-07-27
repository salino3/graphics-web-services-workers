import React, { useState, useEffect, useRef } from "react";
import { BarChartDisplay } from "./components/bar-charts-display.component";
import "./bars-graphic.styles.scss";

// Define the types of data that can be displayed
type ChartDataType = "population" | "pets";

export const BarsGraphic: React.FC = () => {
  const [chartData, setChartData] = useState<{
    labels: string[];
    values: number[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalRecordCount, setOriginalRecordCount] = useState<number>(0);
  // New state to control which data type is currently displayed
  const [currentChartDataType, setCurrentChartDataType] =
    useState<ChartDataType>("population");

  // Use useRef to store the worker instance so it doesn't get re-created on re-renders
  const workerRef = useRef<Worker | null>(null);

  // Function to send a message to the worker to load and process data
  const loadDataWithWorker = (dataType: ChartDataType) => {
    setLoading(true);
    setError(null);
    setChartData(null);
    setOriginalRecordCount(0);
    setCurrentChartDataType(dataType); // Update the current data type state

    // Use the NEW JSON file name for raw persons data
    const jsonPath = import.meta.env.BASE_URL + "persons_data.json";

    if (workerRef.current) {
      // Send a message to the worker to start processing
      // Now, we also send the dataType so the worker knows what to aggregate
      workerRef.current.postMessage({
        type: "loadData",
        payload: jsonPath,
        dataType: dataType, // Pass the selected data type
      });
    }
  };

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

    // Initial data load when component mounts (e.g., default to population)
    loadDataWithWorker("population");

    // Clean up the worker when the component unmounts
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []); // Empty dependency array means this runs once on mount and once on unmount

  // Determine the chart title based on the current data type
  const chartTitle =
    currentChartDataType === "population"
      ? `Total Population per Country (Aggregated from ${originalRecordCount} persons)`
      : `Total Pets per Country (Aggregated from ${originalRecordCount} persons)`;

  return (
    <div className="AppContainer">
      <header className="App-header">
        <h1>Country Data Visualization with Web Workers</h1>
        <p>
          Click the buttons to load and process a large dataset using a Web
          Worker.
        </p>
        <div className="button-group">
          {" "}
          {/* Added a div for button grouping */}
          <button
            onClick={() => loadDataWithWorker("population")}
            disabled={loading || currentChartDataType === "population"}
          >
            {loading && currentChartDataType === "population"
              ? "Processing Population..."
              : "Show Population Chart"}
          </button>
          <button
            onClick={() => loadDataWithWorker("pets")}
            disabled={loading || currentChartDataType === "pets"}
          >
            {loading && currentChartDataType === "pets"
              ? "Processing Pets..."
              : "Show Pets Chart"}
          </button>
        </div>
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
            title={chartTitle} // Pass the dynamic title
            dataType={currentChartDataType} // Pass the data type to BarChartDisplay
          />
        )}
      </main>
    </div>
  );
};
