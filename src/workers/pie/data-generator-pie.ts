// Data definitions for generation
interface PersonData {
  id: number;
  country: string;
  continent: string;
  age: number;
  sex: "male" | "female";
}

// Mapping of countries to continents for more accurate classification
const countryContinentMap: { [key: string]: string } = {
  "Spain": "Europe",
  "Italy": "Europe",
  "Brazil": "South America",
  "USA": "North America",
  "China": "Asia",
  "Germany": "Europe",
  "England": "Europe",
  "Canada": "North America",
  "Australia": "Australia/Oceania",
};

// Function to generate a specific number of person records
const generatePersonsData = (
  numPersons: number,
  startId: number
): PersonData[] => {
  console.log(
    `Data Generator: Generating ${numPersons} person records starting from ID ${startId}...`
  );
  const persons: PersonData[] = [];
  const possibleCountries = Object.keys(countryContinentMap);
  // The type of this array is defined as ["male", "female"]
  const possibleSexes = ["male", "female"] as const;

  for (let i = 0; i < numPersons; i++) {
    const age = Math.floor(18 + Math.random() * 60);
    const randomCountryIndex = Math.floor(
      Math.random() * possibleCountries.length
    );
    const country = possibleCountries[randomCountryIndex];
    const continent = countryContinentMap[country];
    const randomSexIndex = Math.floor(Math.random() * possibleSexes.length);
    const sex = possibleSexes[randomSexIndex];

    persons.push({
      id: startId + i,
      country: country,
      continent: continent,
      age: age,
      sex: sex,
    });
  }
  return persons;
};

// Listen for a message from the parent Web Worker
self.onmessage = (event: MessageEvent) => {
  const { count, startId } = event.data;
  if (count && startId !== undefined) {
    const persons = generatePersonsData(count, startId);
    // Return the generated data to the parent worker
    self.postMessage(persons);
  }
};
