import * as d3 from "../../_node/d3@7.9.0/index.6063bdcc.js";
import * as Plot from "../../_node/@observablehq/plot@0.6.17/index.28168f6d.js";

export const alcohol_order = [
  "Never",
  "Rarely (a few times/month)",
  "Occasionally (1-2 times/week)",
  "Regularly (3-5 times/week)",
  "Daily",
];

// define consistent colors for alcohol frequency categories
const alcoholColorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(alcohol_order);
export const alcoholColors = Object.fromEntries(
  alcohol_order.map((category) => [category, alcoholColorScale(category)]),
);

export function alcoholBmi(data_clean_am, { width } = {}) {
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
  return Plot.plot({
    caption: "Alcohol use in different BMI categories",
    width: width,
    height: 400,
    fx: {
      label: "BMI category",
      domain: ["Underweight", "Normal", "Overweight", "Obese"],
      padding: 0.5,
    },
    x: {
      axis: null,
      label: "Alcohol frequency",
      domain: alcohol_order,
      padding: 0.2,
    },
    y: {
      label: "% of the population in category",
      domain: [0, 70],
      grid: true,
    },
    color: {
      legend: true,
      label: "Alcohol frequency:",
      domain: alcohol_order,
      range: alcohol_order.map((d) => alcoholColors[d]),
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

export function alcoholBmiDiabetes(data_bool, showDiabetics, { width } = {}) {
  const data_filtered = data_bool.filter((d) => d.bmi >= 17 && d.bmi <= 40);

  const marks = [
    // grid lines (subtle for dark backgrounds)
    Plot.ruleY([20, 24, 28, 32, 36, 40], {
      stroke: "#666666",
      strokeWidth: 0.8,
      strokeDasharray: "4 2",
    }),

    Plot.boxY(data_filtered, {
      x: "alcohol_frequency",
      y: "bmi",
      stroke: "white", // dark stroke for contrast
      fill: (d) => alcoholColors[d.alcohol_frequency],
      tip: false,
      jitter: true,
    }),
  ];

  if (showDiabetics) {
    marks.push(
      // diabetic points with outline
      Plot.dot(
        data_filtered.filter((d) => d.diabetes_yes),
        {
          x: "alcohol_frequency",
          y: "bmi",
          fill: "#FF3366",
          stroke: "#000",
          strokeWidth: 0.5,
          r: 4,
          title: (d) => `Diabetic, BMI: ${d.bmi.toFixed(1)}`,
        },
      ),
    );
  }

  return Plot.plot({
    width,
    marks,
    y: {
      label: "BMI",
      domain: [17, 40],
      labelColor: "white",
      tickColor: "white",
    },
    x: {
      label: "Alcohol use",
      tickRotate: 15,
      domain: alcohol_order,
      labelColor: "white",
      tickColor: "white",
      padding: 0.5, // separates x-axis labels
    },
    color: {
      legend: true,
      label: "Legend",
      domain: ["Diabetic"],
      range: ["#FF3366"],
      labelColor: "white",
    },
    style: {
      color: "white",
      fontSize: 12,
    },
    marginBottom: 85,
    marginTop: 35,
    marginLeft: 40,
    marginRight: 20,
  });
}

export function alcoholMigraines(data_bool, { width } = {}) {
  const grouped_data_migraine = d3
    .rollups(
      data_bool,
      (v) => {
        const total = v.length;
        const count = v.filter((d) => d.migraine_yes).length;
        return {
          count,
          percent: (100 * count) / total,
        };
      },
      (d) => d.alcohol_frequency,
    )
    .map(([alcohol, stats]) => ({
      alcohol,
      value_str: "Yes",
      ...stats,
    }));

  return Plot.plot({
    width,
    x: {
      label: "Alcohol frequency",
      domain: alcohol_order,
    },
    y: {
      label: "% with migraine",
      grid: true,
      domain: [0, Math.ceil(d3.max(grouped_data_migraine, (d) => d.percent) + 5)],
    },
    color: {
      label: "Alcohol frequency",
      domain: alcohol_order,
      range: alcohol_order.map((d) => alcoholColors[d]),
    },
    marks: [
      Plot.barY(grouped_data_migraine, {
        x: "alcohol",
        y: "percent",
        fill: (d) => alcoholColors[d.alcohol],
        tip: (d) =>
          `Migraine = Yes\n${d.percent.toFixed(1)}%\n(${d.count} personen)`,
      }),
      Plot.ruleY([0]),
    ],
  });
}
