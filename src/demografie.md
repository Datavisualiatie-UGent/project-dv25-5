# Demographics of Alcohol Consumers in the US

```js
import * as Plot from "@observablehq/plot";
import { select } from "@observablehq/inputs";
import { AlcoholPercentageMap } from "./components/demographics.js";
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
const alcoholByState = d3
  .rollups(
    gut,
    (v) => d3.mean(v, (d) => (d.alcohol_consumption === true ? 1 : 0)) * 100,
    (d) => d.state,
  )
  .map(([state, percentage]) => ({ state, percentage }));
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
function statesAlcoholPercentage() {
  return Plot.plot({
    x: { label: "State", tickRotate: -60 },
    y: { label: "% Alcohol Consumers" },
    marks: [
      Plot.barY(alcoholByState, {
        x: "state",
        y: "percentage",
        fill: "skyblue",
      }),
      Plot.tip(
        alcoholByState,
        Plot.pointerX({
          x: "state",
          y: "percentage",
          title: (d) => `${d.state}: ${d.percentage.toFixed(2)}%`,
          anchor: "bottom",
        }),
      ),
    ],
    marginBottom: 40,
  });
}
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
  ${statesAlcoholPercentage()}
  ${AlcoholPercentageMap(gut)}
</p>

<p>
  <strong>Alcohol Consumption by Age Group</strong>
  ${alcoholByAgePercent.map((d) => `${d.age_cat}: ${d.percentage.toFixed(2)}%`)}
</p>

<p>
  <strong>Alcohol Consumption by gender</strong>
${alcoholByGenderPercent.map((d) => `${d.sex}: ${d.percentage.toFixed(2)}%`)}
</p>

```js
const alcoholByAgeGenderPercent = gut
  .filter((d) => d.alcohol_consumption)
  .reduce((acc, d) => {
    const ageGroup = Math.floor(d.age_years / 10) * 10;
    const gender = d.sex;
    const key = `${ageGroup}_${gender}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const totalByAgeGender = gut.reduce((acc, d) => {
  const ageGroup = Math.floor(d.age_years / 10) * 10;
  const gender = d.sex;
  const key = `${ageGroup}_${gender}`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const alcoholByAgeGenderPercentData = Object.keys(totalByAgeGender).map((key) => {
  const [ageGroup, sex] = key.split("_");
  const consumed = alcoholByAgeGenderPercent[key] || 0;
  const total = totalByAgeGender[key];
  return {
    ageGroup: +ageGroup,
    sex,
    percentage: (consumed / total) * 100,
  };
});
```

```js
function alcoholByGenderChart(selectedAgeGroup) {
  const filtered = alcoholByAgeGenderPercentData.filter(
    (d) => d.ageGroup === selectedAgeGroup,
  );

  return Plot.plot({
    x: { label: "Gender" },
    y: { label: "% Alcohol Consumers", domain: [0, 100] },
    marks: [
      Plot.barY(filtered, {
        x: "sex",
        y: "percentage",
        fill: (d) => (d.sex === "female" ? "pink" : "skyblue"),
      }),
      Plot.text(filtered, {
        x: "sex",
        y: "percentage",
        text: (d) => `${d.percentage.toFixed(1)}%`,
        dy: -10,
      }),
    ],
  });
}
```

```js
const selectedAgeGroup = view(
  Inputs.select([10, 20, 30, 40, 50, 60, 70, 80, 90], { label: "selected age group" }),
);
```

${alcoholByGenderChart(selectedAgeGroup)}
