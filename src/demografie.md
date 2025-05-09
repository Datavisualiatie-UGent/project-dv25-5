---
title: Demographics
---

# Demographics of Alcohol Consumers in the US

```js
import * as Plot from "@observablehq/plot";
import { select } from "@observablehq/inputs";
import { AlcoholPercentageMap, alcoholByGenderChart  } from "./components/demographics.js";
```

```js
// using the entire (unfiltered) dataset for this, since there's not enough data for every state otherwise
let gut = await FileAttachment("data/gut_dataset.csv").csv({ typed: true });

const validStates = new Set([
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
]);

// only keep rows with a valid US state and alcohol consumption data
gut = gut.filter(
  (d) =>
    d.alcohol_consumption !== undefined &&
    d.alcohol_consumption !== null &&
    d.state &&
    validStates.has(d.state) &&
    d.age_years &&
    Math.floor(d.age_years / 10) * 10 >= 10 &&
    Math.floor(d.age_years / 10) * 10 <= 90 &&
    (d.sex === "female" || d.sex === "male"),
);
```

```js
// Count the number of samples for each state
const samplesByState = d3
  .rollups(
    gut,
    (v) => v.length, // Count the number of samples
    (d) => d.state, // Group by state
  )
  .map(([state, count]) => ({ state, count })); // Convert to array of objects
```

```js
const alcoholByAge = gut
  .filter((d) => d.alcohol_consumption)
  .reduce((acc, d) => {
    const ageGroup = Math.floor(d.age_years / 10) * 10;
    acc[ageGroup] = (acc[ageGroup] || 0) + 1;
    return acc;
  }, {});

const totalByAge = gut.reduce((acc, d) => {
  const ageGroup = Math.floor(d.age_years / 10) * 10;
  acc[ageGroup] = (acc[ageGroup] || 0) + 1;
  return acc;
}, {});

const alcoholByAgePercent = Object.keys(alcoholByAge).map((ageGroup) => ({
  age_cat: ageGroup,
  percentage: (alcoholByAge[ageGroup] / totalByAge[ageGroup]) * 100,
}));

const countSamplesPerAgeGroup = d3
  .rollups(
    gut,
    (v) => v.length, // Count the number of samples
    (d) => d.age_years, // Group by age group
  )
  .map(([ageGroup, count]) => ({ ageGroup, count })); // Convert to array of objects

// Aggregate data for Alcohol Consumption by Gender
const alcoholByGender = gut
  .filter((d) => d.alcohol_consumption)
  .reduce((acc, d) => {
    const gender = d.sex;
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {});

const totalByGender = gut.reduce((acc, d) => {
  const gender = d.sex;
  acc[gender] = (acc[gender] || 0) + 1;
  return acc;
}, {});

const alcoholByGenderPercent = Object.keys(alcoholByGender).map((gender) => ({
  sex: gender,
  percentage: (alcoholByGender[gender] / totalByGender[gender]) * 100,
}));
```

<p>
  <strong>Alcohol Consumption by State</strong>
  ${AlcoholPercentageMap(gut)}
</p>

<p>
  <strong>Alcohol Consumption by gender and age group</strong>
  ${alcoholByGenderChart(gut)}
</p>
