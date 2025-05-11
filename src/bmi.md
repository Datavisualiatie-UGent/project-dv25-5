# Alcohol consumption and BMI

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

import { alcoholBmi, alcoholBmiDiabetes } from "./components/alcohol_bmi.js";
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => alcoholBmi(data_clean_am, {width}))}
  </div>
</div>

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
