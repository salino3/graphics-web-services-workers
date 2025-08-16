// Database constants
const DB_NAME = "PersonWorldCupDataDB";
const DB_VERSION = 1;
const STORE_NAME = "persons";

let isProcessing = false;
let db: IDBDatabase | null = null;
let cachedRawPersonsData: any[] | null = null;

// --- IndexedDB utility functions ---

// Function to open the database.
// The connection will be kept open for all subsequent operations.
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

// Reads all data from the object store.
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

// Writes data to the object store.
const writePersonsToDB = async (persons: any[]): Promise<void> => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], "readwrite");
    const objectStore = transaction.objectStore(STORE_NAME);

    transaction.oncomplete = () => {
      console.log("Worker: All persons written to IndexDB.");
      resolve();
    };

    transaction.onerror = (event) => {
      console.error(
        "Worker: Error writing to IndexDB:",
        (event.target as IDBTransaction).error
      );
      reject((event.target as IDBTransaction).error);
    };

    persons.forEach((person) => {
      objectStore.put(person);
    });
  });
};

// Deletes the entire database.
const clearDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close();
      db = null;
    }
    const request = indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => {
      console.log("Worker: IndexedDB deleted successfully.");
      resolve();
    };

    request.onerror = (event) => {
      const error = (event.target as IDBRequest).error;
      console.error("Worker: Error deleting IndexedDB:", error);
      reject(error);
    };

    request.onblocked = () => {
      console.warn(
        "Worker: Deletion blocked. Close all connections to the database."
      );
      reject(new Error("Database deletion blocked."));
    };
  });
};

// --- Main Web Worker logic ---

self.onmessage = async (event: MessageEvent) => {
  if (isProcessing) {
    console.warn("Worker: Ignoring message, another operation is in progress.");
    return;
  }
  isProcessing = true;

  if (event.data.type === "loadData") {
    try {
      let rawPersonsData: any[];

      if (cachedRawPersonsData) {
        rawPersonsData = cachedRawPersonsData;
      } else {
        console.log("Worker: Checking IndexedDB for raw data...");
        rawPersonsData = await readAllPersonsFromDB();

        if (rawPersonsData.length === 0) {
          console.log(
            "Worker: Data not found. Spawning parallel data generators..."
          );
          const startTime = performance.now();
          const totalRecords = 500_000;
          const halfRecords = totalRecords / 2;

          const part1Promise = new Promise<any[]>((resolve) => {
            const worker1 = new Worker(
              new URL("./data-generator-pie.ts", import.meta.url)
            );
            worker1.postMessage({ count: halfRecords, startId: 1 }); // Pass the initial ID
            worker1.onmessage = (e) => {
              console.log("Worker: Received data from worker 1.");
              resolve(e.data);
              worker1.terminate();
            };
          });

          const part2Promise = new Promise<any[]>((resolve) => {
            const worker2 = new Worker(
              new URL("./data-generator-pie.ts", import.meta.url)
            );
            // The second worker handles the remaining records
            // ensuring that the total count is always met
            // even if the number is odd.
            worker2.postMessage({
              count: totalRecords - halfRecords,
              startId: halfRecords + 1,
            }); // Pasa el ID inicial
            worker2.onmessage = (e) => {
              console.log("Worker: Received data from worker 2.");
              resolve(e.data);
              worker2.terminate();
            };
          });

          const [part1, part2] = await Promise.all([
            part1Promise,
            part2Promise,
          ]);
          rawPersonsData = [...part1, ...part2];

          console.log(
            `Worker: Data combined in ${
              performance.now() - startTime
            }ms. Writing to IndexDB...`
          );

          await writePersonsToDB(rawPersonsData);
          console.log(
            `Worker: ${rawPersonsData.length} records combined and saved to IndexedDB.`
          );
        } else {
          console.log(
            `Worker: ${rawPersonsData.length} records loaded from IndexedDB.`
          );
        }
        cachedRawPersonsData = rawPersonsData;
      }

      const countryMap = new Map<
        string,
        { population: number; color: string }
      >();

      rawPersonsData.forEach((person: any) => {
        const countryName = person.country;
        if (!countryMap.has(countryName)) {
          countryMap.set(countryName, { population: 0, color: person.color });
        }
        const stats = countryMap.get(countryName)!;
        stats.population++;
      });

      const processedLabels: string[] = [];
      const processedValues: number[] = [];
      const processedColors: string[] = [];
      const sortedCountryNames = Array.from(countryMap.keys()).sort();

      sortedCountryNames.forEach((countryName) => {
        const stats = countryMap.get(countryName)!;
        processedLabels.push(countryName);
        processedValues.push(stats.population);
        processedColors.push(stats.color);
      });

      console.log(
        `Worker: Data processed. Aggregated into ${processedLabels.length} unique countries. Sending results.`
      );

      self.postMessage({
        type: "dataReady",
        labels: processedLabels,
        values: processedValues,
        colors: processedColors,
        originalRecordCount: rawPersonsData.length,
      });
    } catch (error: any) {
      console.error("Worker: Error processing data:", error);
      self.postMessage({ type: "error", message: error.message });
    }
  } else if (event.data.type === "clearData") {
    console.log("Worker: Clearing IndexedDB...");
    try {
      await clearDatabase();
      cachedRawPersonsData = null; // Borra la caché en memoria
      self.postMessage({ type: "dataCleared" });
    } catch (error: any) {
      console.error("Worker: Error during cleanup process:", error);
      self.postMessage({
        type: "error",
        message: `Error during cleanup process: ${error.message}`,
      });
    }
  }
  isProcessing = false;
};
