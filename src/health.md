---
title: Health
---

<h1 class="no-wrap">Health</h1>

```js
let data_clean_am = await FileAttachment("data/data_clean_am.csv").csv({
  typed: true,
});
let data_bool = data_clean_am.map((d) => ({
  ...d,
  diabetes_yes: d.diabetes !== "I do not have this condition",
  skin_condition_yes: d.skin_condition !== "I do not have this condition",
  ibd_yes: d.ibd !== "I do not have this condition",
  migraine_yes: d.migraine !== "I do not have this condition",
}));

import {
  alcoholBmi,
  alcoholBmiDiabetes,
  alcoholMigraines,
} from "./components/health.js";
```

<h2 class="text-container">Alcohol consumption and BMI</h2>

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => alcoholBmi(data_clean_am, {width}))}
  </div>
</div>

<p class="text-container">When examining health-related variables, several patterns emerge. For instance, alcohol consumption and BMI are clearly related. Most underweight individuals tend to avoid alcohol entirely, while the proportion of daily drinkers increases among those with normal and overweight BMIs. This proportion drops again in the obese group. This might be explained by increased motivation to lose weight among obese individuals, or by health issues that discourage frequent alcohol use.</p>

<h2>Correlation with diabetes</h2>

```js
const showDiabetics = view(
  Inputs.toggle({
    label: "Show diabetics",
    value: "true",
  }),
);
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => alcoholBmiDiabetes(data_bool, showDiabetics, {width}))}
  </div>
</div>

<p class="text-container">Switching perspective, when we look at the BMI distribution within each alcohol group, a general trend emerges: people who drink more frequently tend to have higher BMIs. This correlation becomes even more intriguing when focusing on diabetic individuals. Among those who never drink, all diabetic cases fall well above a healthy BMI. As drinking frequency increases, however, diabetic individuals with normal BMIs become more prevalent. This may hint at a complex interaction between alcohol consumption, weight, and diabetes risk.</p>

<h2>Alcohol consumption and migraines</h2>

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => alcoholMigraines(data_bool, {width}))}
  </div>
</div>

<p class="text-container">Another striking health-related observation involves migraines. People who suffer from migraines are far more common in the groups that rarely or never drink. This suggests that individuals with migraines might avoid alcohol, potentially because it is a known trigger for migraine episodes.</p>

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
    padding-top: 10px;
    padding-bottom: 10px;
  }
</style>
