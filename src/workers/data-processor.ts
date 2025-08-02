// src/workers/data-processor.ts

// Database constants
const DB_NAME = "PersonDataDB";
const DB_VERSION = 1;
const STORE_NAME = "persons";

let db: IDBDatabase | null = null;
let cachedRawPersonsData: any[] | null = null; // Still useful for in-memory caching during a session

// Utility function to open and get the database instance
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbRef = (event.target as IDBOpenDBRequest).result;
      if (!dbRef.objectStoreNames.contains(STORE_NAME)) {
        dbRef.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error(
        "Worker: IndexedDB error:",
        (event.target as IDBOpenDBRequest).error
      );
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

// Utility function to read all data from the object store
const readAllPersonsFromDB = async (): Promise<any[]> => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readonly");
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error(
        "Worker: Error reading from IndexDB:",
        (event.target as IDBRequest).error
      );
      reject((event.target as IDBRequest).error);
    };
  });
};

// Utility function to write data to the object store
const writePersonsToDB = async (persons: any[]): Promise<void> => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(STORE_NAME);

    // Event Listener about 'transaction' objects
    transaction.oncomplete = () => {
      console.log("Worker: All persons written to IndexDB.");
      resolve();
    };

    // Event Listener about 'transaction' objects
    transaction.onerror = (event) => {
      console.error(
        "Worker: Error writing to IndexDB:",
        (event.target as IDBTransaction).error
      );
      reject((event.target as IDBTransaction).error);
    };

    persons.forEach((person) => {
      objectStore.put(person); // Use put to add or update
    });
  });
};

// Remove the import for 'node:fs/promises' as it's not needed in the browser
// import * as fs from "node:fs/promises"; // DELETE THIS LINE

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

// THIS IS THE GENERATION LOGIC - MOVED FROM large-data-generator.ts
const generatePersonsData = (numPersons: number): PersonData[] => {
  console.log(`Worker: Generating ${numPersons} raw person records...`);
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

// 3. Main execution logic within the worker's onmessage handler
// self: Reference at Web Worker itself.
// onmessage: It is a browser event that listens for messages received from the main thread of the application.
self.onmessage = async (event: MessageEvent) => {
  if (event.data.type === "loadData") {
    // We no longer need filePath, as data will be from IndexDB or generated
    const dataType = event.data.dataType;

    try {
      let rawPersonsData: any[];

      // Try to read from in-memory cache first (for current session)
      if (cachedRawPersonsData) {
        console.log(
          `Worker: Using in-memory cached raw data for ${dataType} chart.`
        );
        rawPersonsData = cachedRawPersonsData;
      } else {
        // Then try to read from IndexDB
        console.log("Worker: Checking IndexDB for raw data...");
        rawPersonsData = await readAllPersonsFromDB();

        if (rawPersonsData.length === 0) {
          // Data not in IndexDB, so generate it
          console.log(
            "Worker: Data not found in IndexDB. Generating new data..."
          );
          const numberOfPersonsToGenerate = 1_000_000; // Define your desired number of persons here
          rawPersonsData = generatePersonsData(numberOfPersonsToGenerate);
          await writePersonsToDB(rawPersonsData); // Write to IndexDB for future use
          console.log(
            `Worker: Generated and saved ${rawPersonsData.length} records to IndexDB.`
          );
        } else {
          console.log(
            `Worker: Loaded ${rawPersonsData.length} records from IndexDB.`
          );
        }
        cachedRawPersonsData = rawPersonsData; // Cache in memory for subsequent requests in this session
      }

      // --- AGGREGATION LOGIC (remains mostly the same) ---
      const countryMap = new Map<
        string,
        { population: number; totalPets: number }
      >();
      let globalTotalPets = 0;

      rawPersonsData.forEach((person: any) => {
        const countryName = person.country;
        if (!countryMap.has(countryName)) {
          countryMap.set(countryName, { population: 0, totalPets: 0 });
        }
        const stats = countryMap.get(countryName)!;
        stats.population++;
        stats.totalPets += person.pets;
        globalTotalPets += person.pets;
      });

      const processedLabels: string[] = [];
      const processedValues: number[] = [];

      const sortedCountryNames = Array.from(countryMap.keys()).sort();

      sortedCountryNames.forEach((countryName) => {
        const stats = countryMap.get(countryName)!;
        processedLabels.push(countryName);

        if (dataType === "population") {
          processedValues.push(stats.population);
        } else if (dataType === "pets") {
          processedValues.push(stats.totalPets);
        } else if (dataType === "petsPercentage") {
          const percentage =
            globalTotalPets > 0 ? (stats.totalPets / globalTotalPets) * 100 : 0;
          processedValues.push(parseFloat(percentage.toFixed(2)));
        }
      });

      console.log(
        `Worker: Data processed. Aggregated into ${processedLabels.length} unique countries. Sending results back.`
      );

      // Web Worker send object to main thread
      self.postMessage({
        type: "dataReady",
        labels: processedLabels,
        values: processedValues,
        originalRecordCount: rawPersonsData.length,
        dataType: dataType,
      });
    } catch (error: any) {
      console.error("Worker: Error processing data:", error);
      self.postMessage({ type: "error", message: error.message });
    }
  } else if (event.data.type === "clearData") {
    // NEW: Handle clear data message to delete IndexDB and in-memory cache
    console.log("Worker: Clearing IndexDB and in-memory cache...");
    try {
      await openDatabase(); // Ensure DB is open
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => {
        console.log("Worker: IndexDB deleted successfully.");
        db = null; // Reset db reference
        cachedRawPersonsData = null; // Clear in-memory cache
        self.postMessage({ type: "dataCleared" });
      };
      request.onerror = (event) => {
        const error = (event.target as IDBRequest).error;
        console.error("Worker: Error deleting IndexDB:", error);
        self.postMessage({
          type: "error",
          message: `Failed to clear IndexDB: ${error?.message}`,
        });
      };
    } catch (error: any) {
      console.error("Worker: Error during clear process:", error);
      self.postMessage({
        type: "error",
        message: `Error during clear process: ${error.message}`,
      });
    }
  }
};
