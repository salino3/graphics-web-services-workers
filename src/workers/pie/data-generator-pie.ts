// Data definitions for generation
interface PersonData {
  id: number;
  country: string;
  continent: string;
  age: number;
  sex: "male" | "female";
  color: string;
}

// Mapping of countries to continents
const countryContinentMap: { [key: string]: string } = {
  "Spain": "Europe",
  "Italy": "Europe",
  "Brazil": "South America",
  "USA": "North America",
  "China": "Asia",
  "Germany": "Europe",
  "England": "Europe",
  "Canada": "North America",
  "Australia": "Australia",
};

const countryWeights: { [key: string]: number } = {
  "USA": 30,
  "China": 25,
  "Germany": 15,
  "Spain": 10,
  "Brazil": 8,
  "Australia": 4,
  "Canada": 3,
  "England": 3,
  "Italy": 5,
};

const countryColorMap: { [key: string]: string } = {
  "USA": "#E74C3C",
  "China": "#34495E",
  "Germany": "#3498DB",
  "Spain": "#F1C40F",
  "Brazil": "#9B59B6",
  "Australia": "#1ABC9C",
  "Canada": "#E67E22",
  "England": "#BDC3C7",
  "Italy": "#2ECC71",
};

// A flat matrix is created with the countries repeated according to their weight
const weightedCountries: string[] = [];
for (const country in countryWeights) {
  for (let i = 0; i < countryWeights[country]; i++) {
    weightedCountries.push(country);
  }
}

// Function to generate a specific number of person records
const generatePersonsData = (
  numPersons: number,
  startId: number
): PersonData[] => {
  console.log(
    `Data Generator: Generating ${numPersons} person records starting from ID ${startId}...`
  );
  const persons: PersonData[] = [];
  const possibleSexes = ["male", "female"] as const;
  console.log("clog2", weightedCountries);
  for (let i = 0; i < numPersons; i++) {
    const age = Math.floor(18 + Math.random() * 60);
    // A country is selected from the weighted matrix, not from the original
    const randomCountryIndex = Math.floor(
      Math.random() * weightedCountries.length
    );
    const country = weightedCountries[randomCountryIndex];
    const continent = countryContinentMap[country];
    const color = countryColorMap[country] || "#000000";
    const randomSexIndex = Math.floor(Math.random() * possibleSexes.length);
    const sex = possibleSexes[randomSexIndex];

    persons.push({
      id: startId + i,
      country: country,
      continent: continent,
      age: age,
      sex: sex,
      color: color,
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
