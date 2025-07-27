// src/workers/data-processor.ts
self.onmessage = async (event: MessageEvent) => {
  if (event.data.type === "loadData") {
    const filePath = event.data.payload;
    try {
      console.log(`Worker: Starting to fetch data from ${filePath}`);
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawData = await response.json();
      console.log(`Worker: Fetched ${rawData.length} country records.`); // Ahora serán 20 records

      // --- Data Processing (simplified for new structure) ---
      const processedLabels: string[] = [];
      const processedValues: number[] = [];

      rawData.forEach((item: any) => {
        processedLabels.push(item.countryName); // Usar el nombre del país directamente
        processedValues.push(item.population); // Usar la población agregada
      });

      console.log("Worker: Data processed. Sending results back.");
      self.postMessage({
        type: "dataReady",
        labels: processedLabels,
        values: processedValues,
        originalRecordCount: rawData.length, // Ahora es el número de países únicos
      });
    } catch (error: any) {
      console.error("Worker: Error processing data:", error);
      self.postMessage({ type: "error", message: error.message });
    }
  }
};
