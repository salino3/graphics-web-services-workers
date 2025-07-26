import * as fs from "node:fs/promises";

const generateLargeCountryData = (numRecords: number) => {
  const data = [];
  const baseCountries = [
    { name: "United States", pop: 330, area: 9.8, gdp: 28 },
    { name: "China", pop: 1400, area: 9.6, gdp: 18 },
    { name: "India", pop: 1420, area: 3.2, gdp: 4.1 },
    { name: "Indonesia", pop: 275, area: 1.9, gdp: 1.5 },
    { name: "Pakistan", pop: 240, area: 0.8, gdp: 0.38 },
    { name: "Brazil", pop: 215, area: 8.5, gdp: 2.3 },
    { name: "Nigeria", pop: 220, area: 0.9, gdp: 0.5 },
    { name: "Bangladesh", pop: 170, area: 0.14, gdp: 0.45 },
    { name: "Russia", pop: 144, area: 17.1, gdp: 2.1 },
    { name: "Mexico", pop: 128, area: 2.0, gdp: 1.8 },
    { name: "Japan", pop: 123, area: 0.37, gdp: 4.2 },
    { name: "Philippines", pop: 115, area: 0.3, gdp: 0.44 },
    { name: "Ethiopia", pop: 126, area: 1.1, gdp: 0.15 },
    { name: "Egypt", pop: 110, area: 1.0, gdp: 0.47 },
    { name: "Germany", pop: 83, area: 0.35, gdp: 4.5 },
    { name: "France", pop: 65, area: 0.64, gdp: 3.1 },
    { name: "United Kingdom", pop: 67, area: 0.24, gdp: 3.5 },
    { name: "Italy", pop: 59, area: 0.3, gdp: 2.3 },
    { name: "Canada", pop: 40, area: 9.9, gdp: 2.2 },
    { name: "Australia", pop: 26, area: 7.6, gdp: 1.7 },
  ];

  for (let i = 0; i < numRecords; i++) {
    const base =
      baseCountries[Math.floor(Math.random() * baseCountries.length)];
    const population = Math.floor(
      base.pop * 1_000_000 * (0.8 + Math.random() * 0.4)
    );
    const area = parseFloat(
      (base.area * (0.8 + Math.random() * 0.4)).toFixed(2)
    );
    const gdp = parseFloat((base.gdp * (0.8 + Math.random() * 0.4)).toFixed(2));

    data.push({
      id: i + 1,
      countryName: `${base.name} ${Math.floor(Math.random() * 1000)}`,
      population: population,
      areaSqKm: area,
      gdpBillionUsd: gdp,
    });
  }
  return data;
};

const runGenerator = async () => {
  console.log("Starting data generation process...");
  const numberOfRecords = 100000;
  const largeCountryData = generateLargeCountryData(numberOfRecords);
  const fileName = `large_country_data_${numberOfRecords}.json`;

  console.log(`Attempting to write data to: ${fileName}`);
  console.log(
    `Data size (approx): ${
      JSON.stringify(largeCountryData).length / (1024 * 1024)
    } MB`
  );

  try {
    // fs is now the namespace object containing writeFile
    await fs.writeFile(
      fileName,
      JSON.stringify(largeCountryData, null, 2),
      "utf8"
    );
    console.log(
      `Successfully generated ${numberOfRecords} country records into ${fileName}`
    );
  } catch (error: any) {
    console.error(
      "An error occurred during file writing:",
      error.message || error
    );
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.stack) {
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
};

runGenerator().catch((err) => {
  console.error(
    "Unhandled Promise Rejection in generator script:",
    err.message || err
  );
  if (err.stack) {
    console.error("Stack trace:", err.stack);
  }
  process.exit(1);
});
