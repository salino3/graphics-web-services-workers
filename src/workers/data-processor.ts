self.onmessage = async (event: MessageEvent) => {
  // Expected message: { type: 'loadData', payload: '/path/to/data.json' }
  if (event.data.type === "loadData") {
    const filePath = event.data.payload;
    try {
      console.log(`Worker: Starting to fetch data from ${filePath}`);
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawData = await response.json();
      console.log(`Worker: Fetched ${rawData.length} records.`);

      // --- Data Processing Example ---
      // Let's aggregate population by a simplified 'continent' category
      // For simplicity, we'll just pick the first letter of the country name as a "category"
      // In a real app, you'd have more complex aggregation logic.
      const aggregatedData: { [key: string]: number } = {};
      const processedLabels: string[] = [];
      const processedValues: number[] = [];

      // Group data by a simplified "category" (e.g., first letter of country)
      rawData.forEach((item: any) => {
        const category = item.countryName
          ? item.countryName.charAt(0).toUpperCase()
          : "Other";
        if (!aggregatedData[category]) {
          aggregatedData[category] = 0;
        }
        aggregatedData[category] += item.population; // Summing population
      });

      // Prepare for Chart.js format
      for (const category in aggregatedData) {
        processedLabels.push(category);
        processedValues.push(aggregatedData[category]);
      }

      console.log("Worker: Data processed. Sending results back.");
      self.postMessage({
        type: "dataReady",
        labels: processedLabels,
        values: processedValues,
        originalRecordCount: rawData.length, // Useful for debugging/display
      });
    } catch (error: any) {
      console.error("Worker: Error processing data:", error);
      self.postMessage({ type: "error", message: error.message });
    }
  }
};
