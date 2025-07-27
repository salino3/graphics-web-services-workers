import * as fs from "node:fs/promises";

// 1. Definición de los países base (ahora serán los países finales del dataset)
// Quitamos 'pop' y 'gdp' de aquí, ya que los calcularemos a partir de las personas.
// 'area' se mantiene fija por país.
const baseCountriesDefinitions = [
  { name: "United States", area: 9.8 },
  { name: "China", area: 9.6 },
  { name: "India", area: 3.2 },
  { name: "Indonesia", area: 1.9 },
  { name: "Pakistan", area: 0.8 },
  { name: "Brazil", area: 8.5 },
  { name: "Nigeria", area: 0.9 },
  { name: "Bangladesh", area: 0.14 },
  { name: "Russia", area: 17.1 },
  { name: "Mexico", area: 2.0 },
  { name: "Japan", area: 0.37 },
  { name: "Philippines", area: 0.3 },
  { name: "Ethiopia", area: 1.1 },
  { name: "Egypt", area: 1.0 },
  { name: "Germany", area: 0.35 },
  { name: "France", area: 0.64 },
  { name: "United Kingdom", area: 0.24 },
  { name: "Italy", area: 0.3 },
  { name: "Canada", area: 9.9 },
  { name: "Australia", area: 7.6 },
];

// 2. Función para generar datos de PERSONAS
interface PersonData {
  id: number;
  country: string;
  awi: number; // Aggregate Wage Income (Salario Neto Agregado)
}

const generatePersonsData = (numPersons: number): PersonData[] => {
  console.log(`Generating ${numPersons} person records...`);
  const persons: PersonData[] = [];
  const baseAwiMin = 20000; // Salario mínimo base (USD)
  const baseAwiMax = 70000; // Salario máximo base (USD)

  for (let i = 0; i < numPersons; i++) {
    const randomCountryDef =
      baseCountriesDefinitions[
        Math.floor(Math.random() * baseCountriesDefinitions.length)
      ];
    const awi = Math.floor(
      baseAwiMin + Math.random() * (baseAwiMax - baseAwiMin)
    ); // Salario aleatorio dentro de un rango

    persons.push({
      id: i + 1,
      country: randomCountryDef.name,
      awi: awi,
    });
  }
  return persons;
};

// 3. Función para AGREGAR datos de PERSONAS a datos de PAÍSES
interface AggregatedCountryData {
  id: number;
  countryName: string;
  population: number; // Total de personas en ese país
  areaSqKm: number; // Área fija del país
  aggregateWageIncome: number; // Suma de AWI de todas las personas en el país
}

const aggregatePersonsToCountries = (
  persons: PersonData[]
): AggregatedCountryData[] => {
  console.log("Aggregating person data into country summaries...");
  const countryMap = new Map<
    string,
    { population: number; totalAwi: number }
  >();

  // Inicializar el mapa con los países base y sus propiedades fijas
  baseCountriesDefinitions.forEach((countryDef) => {
    countryMap.set(countryDef.name, { population: 0, totalAwi: 0 });
  });

  // Iterar sobre las personas y agregar sus datos
  persons.forEach((person) => {
    const countryStats = countryMap.get(person.country);
    if (countryStats) {
      countryStats.population++; // Cada persona cuenta como 1 en la población
      countryStats.totalAwi += person.awi;
    }
  });

  // Formatear los datos agregados en el formato final de países
  const aggregatedData: AggregatedCountryData[] = [];
  let idCounter = 1;

  baseCountriesDefinitions.forEach((countryDef) => {
    const stats = countryMap.get(countryDef.name);
    if (stats) {
      aggregatedData.push({
        id: idCounter++,
        countryName: countryDef.name, // Nombre de país fijo, sin números
        population: stats.population, // Población calculada por el número de personas
        areaSqKm: countryDef.area, // Área fija
        aggregateWageIncome: parseFloat(
          (stats.totalAwi / 1_000_000_000).toFixed(2) // Convertir a Billions USD para AWI
        ),
      });
    }
  });

  return aggregatedData;
};

// 4. Función principal de ejecución
const runGenerator = async () => {
  console.log("Starting data generation and aggregation process...");
  const numberOfPersons = 1_000_000; // Generaremos 1 millón de personas para tener una población significativa por país
  const outputFileName = `large_country_data_${numberOfPersons}_persons.json`; // Nombre de archivo más descriptivo

  // Paso 1: Generar los datos de las personas
  const personsData = generatePersonsData(numberOfPersons);

  // Paso 2: Agregarlos a datos de país únicos
  const aggregatedCountryData = aggregatePersonsToCountries(personsData);

  console.log(
    `Attempting to write aggregated country data to: ${outputFileName}`
  );
  console.log(
    `Aggregated data contains ${aggregatedCountryData.length} unique countries.`
  );
  console.log(
    `Total size of aggregated data (approx): ${
      JSON.stringify(aggregatedCountryData).length / (1024 * 1024)
    } MB`
  );

  try {
    await fs.writeFile(
      outputFileName,
      JSON.stringify(aggregatedCountryData, null, 2),
      "utf8"
    );
    console.log(
      `Successfully generated and aggregated ${aggregatedCountryData.length} country records from ${numberOfPersons} persons into ${outputFileName}`
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
