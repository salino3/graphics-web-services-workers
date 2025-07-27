// src/workers/data-processor.ts
self.onmessage = async (event: MessageEvent) => {
  // Expected message: { type: 'loadData', payload: '/path/to/data.json', dataType: 'population' | 'pets' }
  if (event.data.type === "loadData") {
    const filePath = event.data.payload;
    const dataType = event.data.dataType; // Get the data type from the message

    try {
      console.log(
        `Worker: Starting to fetch raw data from ${filePath} for ${dataType} chart.`
      );
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawPersonsData = await response.json(); // Now this is an array of persons
      console.log(
        `Worker: Fetched ${rawPersonsData.length} raw person records.`
      );

      // --- AGGREGATION LOGIC MOVED TO WEB WORKER ---
      // This is where the heavy lifting happens now!
      const countryMap = new Map<
        string,
        { population: number; totalPets: number }
      >();

      // First pass: Populate countryMap with aggregated data
      rawPersonsData.forEach((person: any) => {
        const countryName = person.country;
        if (!countryMap.has(countryName)) {
          countryMap.set(countryName, { population: 0, totalPets: 0 });
        }
        const stats = countryMap.get(countryName)!; // ! asserts it exists after .has check
        stats.population++;
        stats.totalPets += person.pets;
      });

      // Second pass: Extract labels and values for Chart.js
      const processedLabels: string[] = [];
      const processedValues: number[] = [];

      // Sort countries alphabetically for consistent chart order
      const sortedCountryNames = Array.from(countryMap.keys()).sort();

      sortedCountryNames.forEach((countryName) => {
        const stats = countryMap.get(countryName)!;
        processedLabels.push(countryName); // Labels are unique country names

        if (dataType === "population") {
          processedValues.push(stats.population); // Use aggregated population
        } else if (dataType === "pets") {
          processedValues.push(stats.totalPets); // Use aggregated totalPets
        }
      });

      console.log(
        `Worker: Data processed. Aggregated into ${processedLabels.length} unique countries. Sending results back.`
      );
      self.postMessage({
        type: "dataReady",
        labels: processedLabels,
        values: processedValues,
        originalRecordCount: rawPersonsData.length, // Now this is the count of raw persons
      });
    } catch (error: any) {
      console.error("Worker: Error processing data:", error);
      self.postMessage({ type: "error", message: error.message });
    }
  }
};
