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
}

export const BarsGraphic: React.FC = () => {
  const [chartData, setChartData] = useState<ProcessedChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalRecordCount, setOriginalRecordCount] = useState<number>(0);
  const [currentChartDataType, setCurrentChartDataType] =
    useState<ChartDataType>("");

  // NEW: State to cache processed chart data for each type
  const [cachedProcessedData, setCachedProcessedData] = useState<
    Partial<Record<ChartDataType, ProcessedChartData>>
  >({});

  const workerRef = useRef<Worker | null>(null);

  // Function to send a message to the worker to load and process data
  const loadDataWithWorker = (dataType: ChartDataType) => {
    // Check if data for this type is already in cache
    if (cachedProcessedData[dataType]) {
      console.log(`Main Thread: Displaying cached data for ${dataType} chart.`);
      setChartData(cachedProcessedData[dataType]!); // Use ! as we checked for existence
      setOriginalRecordCount(
        cachedProcessedData[dataType]!.originalRecordCount
      );
      setCurrentChartDataType(dataType);
      setLoading(false); // No loading needed if cached
      return; // Exit early: data is already available in main thread cache
    }

    // If not in cache, proceed to load from worker
    setLoading(true);
    setError(null);
    setChartData(null); // Clear previous chart data to show loading state
    setOriginalRecordCount(0);
    setCurrentChartDataType(dataType);

    const jsonPath = import.meta.env.BASE_URL + "persons_data.json";

    // Ensure workerRef.current is not null before posting message
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "loadData",
        payload: jsonPath,
        dataType: dataType,
      });
    } else {
      // This case should ideally not happen if useEffect initializes worker correctly
      console.error("Worker not initialized when trying to load data.");
      setError("Worker not ready. Please refresh the page.");
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize the Web Worker only once when the component mounts
    // and assign its event handlers.
    const worker = new Worker(
      new URL("../../workers/data-processor.ts", import.meta.url)
    );
    workerRef.current = worker; // Assign to ref

    // Listen for messages from the worker
    worker.onmessage = (event: MessageEvent) => {
      setLoading(false);
      if (event.data.type === "dataReady") {
        const receivedData: ProcessedChartData = {
          labels: event.data.labels,
          values: event.data.values,
          originalRecordCount: event.data.originalRecordCount,
        };
        setChartData(receivedData);
        setOriginalRecordCount(receivedData.originalRecordCount);

        // Cache the received processed data using the currentChartDataType
        // This ensures the data is stored under the type that was requested
        setCachedProcessedData((prev) => ({
          ...prev,
          [currentChartDataType || "typeX"]: receivedData,
        }));
      } else if (event.data.type === "error") {
        setError(event.data.message);
      }
    };

    // Handle errors from the worker
    worker.onerror = (e) => {
      // Assign onerror directly to the worker instance
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
  }, []); // Empty dependency array: this effect runs only once on mount and once on unmount

  // Determine the chart title based on the current data type
  const chartTitle =
    currentChartDataType === "population"
      ? `Total Population per Country (Aggregated from ${originalRecordCount} persons)`
      : currentChartDataType === "pets"
      ? `Total Pets per Country (Aggregated from ${originalRecordCount} persons)`
      : `Percentage of Total Pets per Country (Aggregated from ${originalRecordCount} persons)`;

  console.log("clog1", chartData);
  console.log("clog2", currentChartDataType);
  return (
    <div className="AppContainer">
      <header className="App-header">
        <h1>Country Data Visualization with Web Workers</h1>
        <p>
          Click the buttons to load and process a large dataset using a Web
          Worker.
        </p>
        <button
          className="clear"
          onClick={() => {
            setChartData(null);

            setCurrentChartDataType("");
          }}
        >
          Clear data
        </button>

        <div className="button-group">
          {/* Population button */}
          {/* <button  className="button"
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

      <main className="App-main">
        {error && <p className="error-message">Error: {error}</p>}
        {loading && currentChartDataType && (
          <p style={{ color: "gold" }}>
            Loading and processing data. Your UI remains responsive!
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
          <p>Please select a chart type to load data.</p>
        )}
      </main>
    </div>
  );
};
