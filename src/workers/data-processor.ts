// src/workers/data-processor.ts

// Database constants
const DB_NAME = "PersonDataDB";
const DB_VERSION = 1;
const STORE_NAME = "persons";

let isProcessing: boolean = false; // State flag to prevent race conditions

// Utility function to open and get the database instance
// This function no longer caches the database connection.
// It will always open a new connection, and the caller must close it.
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbRef = (event.target as IDBOpenDBRequest).result;
      if (!dbRef.objectStoreNames.contains(STORE_NAME)) {
        dbRef.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
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
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
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

    // FIX: Ensure the database connection is closed after the transaction completes
    transaction.oncomplete = () => {
      db.close();
    };
  });
};

// Utility function to write data to the object store
const writePersonsToDB = async (persons: any[]): Promise<void> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(STORE_NAME);

    // Event Listener after everything is done in the transaction objects
    transaction.oncomplete = () => {
      console.log("Worker: All persons written to IndexDB.");
      // FIX: Close the database connection after the transaction completes
      db.close();
      resolve();
    };

    // Event Listener after everything is done in the transaction objects
    transaction.onerror = (event) => {
      console.error(
        "Worker: Error writing to IndexDB:",
        (event.target as IDBTransaction).error
      );
      // FIX: Close the database connection even if there's an error
      db.close();
      reject((event.target as IDBTransaction).error);
    };

    persons.forEach((person) => {
      objectStore.put(person);
    });
  });
};

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

interface PersonData {
  id: number;
  country: string;
  age: number;
  work: string;
  awi: number; // Aggregate Wage Income
  pets: number; // Number of pets this person has
}

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

// Refactored clear database logic into an awaitable Promise
const clearDatabaseAndCache = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // FIX: No need to close the database here anymore, as the read/write functions
    // now handle their own connections. This prevents the "Deletion blocked" error.

    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      console.log("Worker: IndexDB deleted successfully.");
      resolve(); // Resolve the promise on success
    };

    request.onerror = (event) => {
      const error = (event.target as IDBRequest).error;
      console.error("Worker: Error deleting IndexDB:", error);
      reject(error); // Reject the promise on error
    };

    request.onblocked = () => {
      console.warn(
        "Worker: Deletion blocked. Close all connections to the database."
      );
      reject(new Error("Database deletion blocked."));
    };
  });
};

// 3. Main execution logic within the worker's onmessage handler
// self: Reference at Web Worker itself.
// onmessage: It is a browser event that listens for messages received from the main thread of the application.
self.onmessage = async (event: MessageEvent) => {
  if (isProcessing) {
    console.warn(
      "Worker: Ignoring message as another operation is in progress."
    );
    return;
  }
  isProcessing = true;

  if (event.data.type === "loadData") {
    const dataType = event.data.dataType;

    try {
      let rawPersonsData: any[];

      // FIX: Removed the in-memory cache to simplify the flow.
      // We will now always read from IndexedDB, which ensures the data is consistent
      // after a successful "Clear" operation.
      console.log("Worker: Checking IndexDB for raw data...");
      rawPersonsData = await readAllPersonsFromDB();

      if (rawPersonsData.length === 0) {
        console.log(
          "Worker: Data not found in IndexDB. Generating new data..."
        );
        const numberOfPersonsToGenerate = 1_000_000;
        rawPersonsData = generatePersonsData(numberOfPersonsToGenerate);
        await writePersonsToDB(rawPersonsData);
        console.log(
          `Worker: Generated and saved ${rawPersonsData.length} records to IndexDB.`
        );
      } else {
        console.log(
          `Worker: Loaded ${rawPersonsData.length} records from IndexDB.`
        );
      }

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
    console.log("Worker: Clearing IndexDB and in-memory cache...");
    try {
      await clearDatabaseAndCache();
      self.postMessage({ type: "dataCleared" });
    } catch (error: any) {
      console.error("Worker: Error during clear process:", error);
      self.postMessage({
        type: "error",
        message: `Error during clear process: ${error.message}`,
      });
    }
  }
  isProcessing = false; // Reset the flag once the operation is complete
};
