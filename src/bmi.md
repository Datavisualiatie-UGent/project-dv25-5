# Alcohol consumption and BMI

```js
let data_clean_am = await FileAttachment("data/data_clean_am.csv").csv({ typed: true });
let data_bool = data_clean_am.map((d) => ({
  ...d,
  diabetes_yes: d.diabetes !== "I do not have this condition",
  skin_condition_yes: d.skin_condition !== "I do not have this condition",
  ibd_yes: d.ibd !== "I do not have this condition",
  migraine_yes: d.migraine !== "I do not have this condition",
  diabetes_yes: d.diabetes !== "I do not have this condition",
}));
```

```js
const grouped = d3.rollups(
  data_clean_am,
  (v) => v.length,
  (d) => d.bmi_cat,
  (d) => d.alcohol_frequency,
);

const alcohol_bmi_data_pct = grouped.flatMap(([bmi, subgroups]) => {
  const total = d3.sum(subgroups, ([, count]) => count);
  return subgroups.map(([alcohol, count]) => ({
    bmi,
    alcohol,
    percent: (count / total) * 100,
  }));
});

function AlcoholBMI() {
  return Plot.plot({
    width: 800,
    height: 400,
    fx: {
      label: "BMI category",
      domain: ["Underweight", "Normal", "Overweight", "Obese"],
      padding: 0.5,
    },
    x: {
      axis: null,
      label: "Alcohol frequency",
      domain: [
        "Never",
        "Rarely (a few times/month)",
        "Occasionally (1-2 times/week)",
        "Regularly (3-5 times/week)",
        "Daily",
      ],
      padding: 0.2,
    },
    y: {
      label: "% of the population in category",
      domain: [0, 100],
      grid: true,
    },
    color: {
      legend: true,
      label: "Alcohol frequency:",
      domain: [
        "Never",
        "Rarely (a few times/month)",
        "Occasionally (1-2 times/week)",
        "Regularly (3-5 times/week)",
        "Daily",
      ],
    },
    marks: [
      Plot.barY(alcohol_bmi_data_pct, {
        fx: "bmi",
        x: "alcohol",
        y: "percent",
        fill: "alcohol",
        tip: true,
        sort: { x: null, color: null, fx: { value: "-y", reduce: "sum" } },
      }),
      Plot.ruleY([0]),
    ],
  });
}
```

${AlcoholBMI()}
