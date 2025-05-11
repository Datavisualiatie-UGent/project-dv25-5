---
title: Demographics
---

<h1 class="no-wrap">Demographics of Alcohol Consumers in the US</h1>

```js
import * as Plot from "@observablehq/plot";
import { select } from "@observablehq/inputs";
import {
  alcoholPercentageMap,
  alcoholByGenderChart,
} from "./components/demographics.js";
```

```js
let gut = await FileAttachment("data/gut_dataset.csv").csv({ typed: true });
```

<p class="text-container">Before exploring the relationship between alcohol consumption and other factors, we'll begin by identifying the demographic groups in the US that consume alcohol.</p>

<h2>Percentage of alcohol consumers per state</h2>

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => alcoholPercentageMap(gut, {width}))}
  </div>
</div>

<p class="text-container">
Overall, many people across the US report consuming alcohol.
While not all states have a sufficient amount of samples to draw definitive conclusions, we can still make some observations.
Central states such as Utah and Kansas tend to have lower alcohol consumption rates compared to states like Arizona and California. In Utah's case, this is likely due to the state's large Mormon population, which typically abstains from drinking.
</p>

<h2 class="no-wrap">Percentage of alcohol consumers per age group/gender</h2>

```js
const alcoholFrequencies = [
  "All",
  "Daily",
  "Regularly (3-5 times/week)",
  "Occasionally (1-2 times/week)",
  "Rarely (a few times/month)",
];

const selectedFrequency = view(
  Inputs.select(alcoholFrequencies, {
    label: "alcohol consumption frequency",
    value: "All",
  }),
);
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => alcoholByGenderChart(gut, selectedFrequency, {width}))}
  </div>
</div>

<p class="text-container">Alcohol consumption appears to be fairly evenly distributed across different age groups and gender. However, a closer look at specific alcohol consumption frequencies reveals that men tend to drink alcohol more frequently than women do. 
For instance, daily drinking is more common among men in their 60s, 70s, and 80s compared to women in the same age groups. Similarly, men in their 30s are more likely to drink regularly than women. On the other hand, when it comes to people who drink only rarely, women consistently outnumber men.</p>

<style>
  .no-wrap {
    white-space: nowrap;
  }

  .text-container {
    width: 100%;
    max-width: 880px;  /* Match the width your charts use */
    margin-left: auto;
    margin-right: auto;
    white-space: normal;
    padding-top: 20px;
    padding-bottom: 30px;
  }
</style>
