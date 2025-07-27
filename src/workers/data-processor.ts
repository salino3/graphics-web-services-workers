// src/workers/data-processor.ts
self.onmessage = async (event: MessageEvent) => {
  // Expected message: { type: 'loadData', payload: '/path/to/data.json', dataType: 'population' | 'pets' | 'petsPercentage' }
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
      const rawPersonsData = await response.json(); // Array of persons
      console.log(
        `Worker: Fetched ${rawPersonsData.length} raw person records.`
      );

      // --- AGGREGATION LOGIC ---
      const countryMap = new Map<
        string,
        { population: number; totalPets: number }
      >();
      let globalTotalPets = 0; // To calculate total pets across all countries

      // First pass: Populate countryMap with aggregated data and calculate global total pets
      rawPersonsData.forEach((person: any) => {
        const countryName = person.country;
        if (!countryMap.has(countryName)) {
          countryMap.set(countryName, { population: 0, totalPets: 0 });
        }
        const stats = countryMap.get(countryName)!;
        stats.population++;
        stats.totalPets += person.pets;
        globalTotalPets += person.pets; // Accumulate global total
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
          processedValues.push(stats.population); // Aggregated population
        } else if (dataType === "pets") {
          processedValues.push(stats.totalPets); // Aggregated totalPets
        } else if (dataType === "petsPercentage") {
          // Calculate percentage of total pets for this country
          const percentage =
            globalTotalPets > 0 ? (stats.totalPets / globalTotalPets) * 100 : 0;
          processedValues.push(parseFloat(percentage.toFixed(2))); // Store as percentage (e.g., 2.50)
        }
      });

      console.log(
        `Worker: Data processed. Aggregated into ${processedLabels.length} unique countries. Sending results back.`
      );
      self.postMessage({
        type: "dataReady",
        labels: processedLabels,
        values: processedValues,
        originalRecordCount: rawPersonsData.length, // Count of raw persons processed
      });
    } catch (error: any) {
      console.error("Worker: Error processing data:", error);
      self.postMessage({ type: "error", message: error.message });
    }
  }
};
