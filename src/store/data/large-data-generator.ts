import * as fs from "node:fs/promises";

// 1. Definition of base countries (used for assigning a country to each person)
const baseCountriesDefinitions = [
  { name: "United States", area: 9.8, avg: 2 },
  { name: "China", area: 9.6, avg: 4 },
  { name: "India", area: 3.2, avg: 8 },
  { name: "Indonesia", area: 1.9, avg: 8 },
  { name: "Pakistan", area: 0.8, avg: 5 },
  { name: "Brazil", area: 8.5, avg: 2 },
  { name: "Nigeria", area: 0.9, avg: 3 },
  { name: "Bangladesh", area: 0.14, avg: 9 },
  { name: "Russia", area: 17.1, avg: 3 },
  { name: "Mexico", area: 2.0, avg: 2 },
  { name: "Japan", area: 0.37, avg: 2 },
  { name: "Philippines", area: 0.3, avg: 5 },
  { name: "Ethiopia", area: 1.1, avg: 10 },
  { name: "Egypt", area: 1.0, avg: 3 },
  { name: "Germany", area: 0.35, avg: 2 },
  { name: "France", area: 0.64, avg: 2 },
  { name: "United Kingdom", area: 0.24, avg: 4 },
  { name: "Italy", area: 0.3, avg: 5 },
  { name: "Canada", area: 9.9, avg: 6 },
  { name: "Australia", area: 7.6, avg: 7 },
];

// 2. Interface for Person Data (includes age, work, awi, and pets)
interface PersonData {
  id: number;
  country: string;
  age: number;
  work: string;
  awi: number; // Aggregate Wage Income
  pets: number; // Number of pets this person has
}

const generatePersonsData = (numPersons: number): PersonData[] => {
  console.log(`Generating ${numPersons} raw person records...`);
  const persons: PersonData[] = [];
  const baseAwiMin = 20000; // Base minimum annual wage income (USD)
  const baseAwiMax = 70000; // Base maximum annual wage income (USD)
  const possibleWorks = [
    "Teacher",
    "Engineer",
    "Doctor",
    "Artist",
    "Programmer",
    "Chef",
    "Student",
    "Retired",
    "Manager",
    "Salesperson",
  ];

  for (let i = 0; i < numPersons; i++) {
    const randomCountryDef =
      baseCountriesDefinitions[
        Math.floor(Math.random() * baseCountriesDefinitions.length)
      ];
    const awi = Math.floor(
      baseAwiMin + Math.random() * (baseAwiMax - baseAwiMin)
    );
    const age = Math.floor(18 + Math.random() * 60); // Age between 18 and 77
    const work =
      possibleWorks[Math.floor(Math.random() * possibleWorks.length)];
    const pets = Math.floor(Math.random() * randomCountryDef.avg); // 0 to X pets

    persons.push({
      id: i + 1,
      country: randomCountryDef.name,
      age: age,
      work: work,
      awi: awi,
      pets: pets,
    });
  }
  return persons;
};

// 3. Main execution function
const runGenerator = async () => {
  console.log("Starting raw data generation process...");
  const numberOfPersons = 1_000_000; // Generate 1 million raw person records
  // New output file name to reflect it's raw person data
  const outputFileName = `raw_persons_data_${numberOfPersons}.json`;

  // Step 1: Generate the raw person data
  const personsData = generatePersonsData(numberOfPersons);

  console.log(`Attempting to write raw person data to: ${outputFileName}`);
  console.log(
    `Raw data contains ${personsData.length} individual person records.`
  );
  console.log(
    `Total size of raw data (approx): ${
      JSON.stringify(personsData).length / (1024 * 1024)
    } MB`
  );

  try {
    await fs.writeFile(
      outputFileName,
      JSON.stringify(personsData, null, 2),
      "utf8"
    );
    console.log(
      `Successfully generated ${personsData.length} raw person records into ${outputFileName}`
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
