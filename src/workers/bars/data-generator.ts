// Data definitions for generation
interface PersonData {
  id: number;
  country: string;
  age: number;
  work: string;
  awi: number; // Annual Wage Income
  pets: number;
}

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

// Function that generates a specific number of person records
const generatePersonsData = (
  numPersons: number,
  startId: number
): PersonData[] => {
  console.log(
    `Data Generator: Generating ${numPersons} person records starting from ID ${startId}...`
  );
  const persons: PersonData[] = [];
  const baseAwiMin = 20000;
  const baseAwiMax = 70000;
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
    const age = Math.floor(18 + Math.random() * 60);
    const work =
      possibleWorks[Math.floor(Math.random() * possibleWorks.length)];
    const pets = Math.floor(Math.random() * randomCountryDef.avg);

    persons.push({
      id: startId + i,
      country: randomCountryDef.name,
      age: age,
      work: work,
      awi: awi, // Annual Wage Income
      pets: pets,
    });
  }
  return persons;
};

// Listen for a message from its parent worker
self.onmessage = (event) => {
  const { count, startId } = event.data;
  if (count && startId !== undefined) {
    const persons = generatePersonsData(count, startId);
    // Return the generated data to the parent worker
    self.postMessage(persons);
  }
};
