import React, { useEffect, useRef, useState } from "react";
import "./pie-graphic.styles.scss";

interface ProcessedChartData {
  labels: string[];
  values: number[];
  originalRecordCount: number;
}

export const PieGrafic: React.FC = () => {
  const [chartData, setChartData] = useState<ProcessedChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalRecordCount, setOriginalRecordCount] = useState<number>(0);

  // State to cache processed chart data for each type
  const [cachedProcessedData, setCachedProcessedData] = useState<
    Partial<ProcessedChartData>
  >({});

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

  console.log("chartData", chartData);
  return (
    <div className="rootPieGrafic">
      <button onClick={() => loadDataWithWorker()}>Click me</button>
    </div>
  );
};
