import React, { useState, useEffect, useRef } from "react";
import { BarChartDisplay } from "./components/bar-charts-display.component";
import "./bars-graphic.styles.scss";

// Define the types of data that can be displayed
type ChartDataType = "" | "population" | "pets" | "petsPercentage";

// Define a type for the processed chart data structure
interface ProcessedChartData {
  labels: string[];
  values: number[];
  originalRecordCount: number; // Keep track of the raw data count
  dataType: ChartDataType;
}

export const BarsGraphic: React.FC = () => {
  const [chartData, setChartData] = useState<ProcessedChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalRecordCount, setOriginalRecordCount] = useState<number>(0);
  const [currentChartDataType, setCurrentChartDataType] =
    useState<ChartDataType>("");

  // State to cache processed chart data for each type
  const [cachedProcessedData, setCachedProcessedData] = useState<
    Partial<Record<ChartDataType, ProcessedChartData>>
  >({});

  const workerRef = useRef<Worker | null>(null);

  // Function to send a message to the worker to load and process data
  const loadDataWithWorker = (dataType: ChartDataType) => {
    // Check if data for this type is already in cache
    if (cachedProcessedData[dataType]) {
      console.log(`Main Thread: Displaying cached data for ${dataType} chart.`);
      setChartData(cachedProcessedData[dataType]!);
      setOriginalRecordCount(
        cachedProcessedData[dataType]!.originalRecordCount
      );
      setCurrentChartDataType(dataType);
      setLoading(false);
      return;
    }

    // If not in cache, proceed to load from worker
    setLoading(true);
    setError(null);
    setChartData(null); // Clear previous chart data to show loading state
    setOriginalRecordCount(0);
    setCurrentChartDataType(dataType); // Update state immediately for loading message

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "loadData",
        dataType: dataType,
      });
    } else {
      console.error("Worker not initialized when trying to load data.");
      setError("Worker not ready. Please refresh the page.");
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize the Web Worker only once when the component mounts
    // and assign its event handlers.
    // NOTE: The `{ type: 'module' }` option is crucial for the worker to handle `import.meta.url`
    const worker = new Worker(
      new URL("../../workers/bars/data-processor.ts", import.meta.url),
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
          originalRecordCount: event.data.originalRecordCount,
          dataType: event.data.dataType,
        };
        setChartData(receivedData);
        setOriginalRecordCount(receivedData.originalRecordCount);
        setCachedProcessedData((prev) => ({
          ...prev,
          [receivedData?.dataType]: receivedData,
        }));
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

  const chartTitle =
    currentChartDataType === "population"
      ? `Total Population per Country (Aggregated from ${originalRecordCount} persons)`
      : currentChartDataType === "pets"
      ? `Total Pets per Country (Aggregated from ${originalRecordCount} persons)`
      : `Percentage of Total Pets per Country (Aggregated from ${originalRecordCount} persons)`;

  return (
    <div className="rootBarsGraphic">
      <header className="AppHeader">
        <h1>Country Data Visualization with Web Workers</h1>
        <p>
          500,000 registers are generated and stored locally using IndexedDB in
          a Web Worker, ensuring a responsive UI and offline capabilities.
        </p>

        <button
          className="clear"
          onClick={() => {
            setChartData(null);
            setCachedProcessedData({}); // Clear the in-memory cache
            setCurrentChartDataType("");
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

        <div className="button-group">
          {/* Population button */}
          {/* <button 
            className="button"
            onClick={() => loadDataWithWorker("population")}
            disabled={loading || currentChartDataType === "population"}
          >
            {loading && currentChartDataType === "population"
              ? "Processing Population..."
              : "Show Population Chart"}
          </button> */}
          {/* Pets button */}
          <button
            className="button"
            onClick={() => loadDataWithWorker("pets")}
            disabled={loading || currentChartDataType === "pets"}
          >
            {loading && currentChartDataType === "pets"
              ? "Processing Pets..."
              : "Show Pets Chart"}
          </button>
          {/* Pets Percentage button */}
          <button
            className="button"
            onClick={() => loadDataWithWorker("petsPercentage")}
            disabled={loading || currentChartDataType === "petsPercentage"}
          >
            {loading && currentChartDataType === "petsPercentage"
              ? "Processing Pet %..."
              : "Show Pet Percentage Chart"}
          </button>
        </div>
      </header>

      <main className="AppMain">
        {error && <p className="error-message">Error: {error}</p>}
        {loading && currentChartDataType && (
          <p className="pLoading">
            {" "}
            <span></span>
            Loading and processing data. Your UI remains responsive!{" "}
            <span></span>
          </p>
        )}
        {chartData && currentChartDataType && (
          <BarChartDisplay
            labels={chartData.labels}
            values={chartData.values}
            title={chartTitle}
            dataType={currentChartDataType}
          />
        )}
        {!loading && !chartData && !error && (
          <p
            style={{
              color: "black",
            }}
          >
            Please select a chart type to load data.
          </p>
        )}
      </main>
    </div>
  );
};
