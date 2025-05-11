---
title: Health
---

<h1 class="no-wrap">Alcohol consumption and BMI</h1>

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

<p class="text-container">This chart shows the percentage of people who consume alcohol at different frequencies across BMI categories. Notably, most underweight individuals never drink alcohol. The proportion of daily drinkers rises from underweight to normal and then to overweight, but drops again in the obese group. This might be explained by increased motivation to lose weight among obese individuals, or by health issues that discourage frequent alcohol use.</p>

<h3>Correlation with diabetes</h3>

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

<p class="text-container">This chart flips the perspective, showing the BMI distribution within each alcohol consumption group. Overall, higher alcohol frequency is associated with an increase in BMI.</p>

<p class="text-container">
When highlighting diabetic individuals, it's striking that in the group that never drinks, all cases are well above a healthy BMI. In contrast, as alcohol use increases, more diabetics appear with a normal BMI. This may suggest a potential link between alcohol consumption and the presence of diabetes in individuals with a healthy weight.</p>

<h3>Alcohol consumption and migraines</h3>

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => alcoholMigraines(data_bool, {width}))}
  </div>
</div>

<p class="text-container">This plot shows that people who suffer from migraines are significantly more represented in the group that rarely or never drinks alcohol. It suggests that individuals with migraines may avoid alcohol more often, possibly due to alcohol being a known trigger or worsening factor.</p>

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
