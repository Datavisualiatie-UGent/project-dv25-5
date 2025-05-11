# Eating habits

```js
let data = await FileAttachment("data/data_am_numeric.csv").csv({ typed: true });
```

```js
const categoryOrders = {
  gluten: [
    "I do not eat gluten because it makes me feel bad",
    "No",
    "I was diagnosed with celiac disease",
    "I was diagnosed with gluten allergy (anti-gluten IgG), but not celiac disease",
  ],
  lactose: ["TRUE", "FALSE"],
  multivitamin: ["TRUE", "FALSE"],
};

const kleurensets = {
  gluten: d3
    .scaleOrdinal()
    .domain([
      "I do not eat gluten because it makes me feel bad",
      "No",
      "I was diagnosed with celiac disease",
      "I was diagnosed with gluten allergy (anti-gluten IgG), but not celiac disease",
    ])
    .range(["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3"]),

  lactose: d3.scaleOrdinal().domain([true, false]).range(["#1f78b4", "#a6cee3"]),

  multivitamin: d3
    .scaleOrdinal()
    .domain([true, false])
    .range(["#1f78b4", "#a6cee3"]),
};

function makeWafelChartMulti(categories, size = 100, selectedVariable) {
  let blocks = [];
  let start = 0;

  let cols = Math.ceil(Math.sqrt(size));
  let rows = Math.ceil(size / cols);

  let fixedOrder = categoryOrders[selectedVariable];

  let categoryMap = new Map(categories.map((c) => [c.label, c]));

  let completeCategories = fixedOrder.map((label) => {
    let cat = categoryMap.get(label);
    return {
      label: label,
      percentage: cat ? cat.percentage : 0,
    };
  });

  let rawCounts = completeCategories.map((c) => ({
    label: c.label,
    count: Math.floor(c.percentage * size),
    percentage: c.percentage,
  }));

  let total = rawCounts.reduce((sum, c) => sum + c.count, 0);
  let remainder = size - total;

  rawCounts
    .sort((a, b) => (b.percentage % 1) - (a.percentage % 1))
    .forEach((c) => {
      if (remainder > 0) {
        c.count += 1;
        remainder -= 1;
      }
    });

  rawCounts.forEach((c) => {
    for (let i = 0; i < c.count; i++) {
      let index = start + i;
      blocks.push({
        label: c.label,
        row: Math.floor(index / cols),
        col: index % cols,
      });
    }
    start += c.count;
  });

  return blocks;
}

function makeLegend(variable) {
  let legendData = [];

  if (variable === "gluten") {
    legendData = [
      {
        label: "I do not eat gluten because it makes me feel bad",
        color: "#66c2a5",
      },
      { label: "No", color: "#fc8d62" },
      { label: "I was diagnosed with celiac disease", color: "#8da0cb" },
      {
        label:
          "I was diagnosed with gluten allergy (anti-gluten IgG), but not celiac disease",
        color: "#e78ac3",
      },
    ];
  } else if (variable === "lactose") {
    legendData = [
      { label: "true", color: "#1f78b4" },
      { label: "false", color: "#a6cee3" },
    ];
  } else if (variable === "multivitamin") {
    legendData = [
      { label: "true", color: "#1f78b4" },
      { label: "false", color: "#a6cee3" },
    ];
  }

  const svgWidth = variable === "gluten" ? 500 : 150;

  return html`
    <div style="margin-top: 10px; margin-bottom: 20px;">
      <h5>Legend for ${variable.charAt(0).toUpperCase() + variable.slice(1)}</h5>
      <svg width="${svgWidth}" height="${legendData.length * 20}">
        ${legendData.map(
          (entry, index) => svg`
          <rect x="0" y="${index * 20}" width="15" height="15" fill="${
            entry.color
          }" />
          <text x="20" y="${index * 20 + 12}" font-size="12" fill="white">${
            entry.label
          }</text>
        `,
        )}
      </svg>
    </div>
  `;
}
```

```js
const selectedVariable = view(
  Inputs.radio(["gluten", "lactose", "multivitamin"], {
    label: "Choose nutritional intake:",
    value: "gluten",
  }),
);
```

```js
let result = [];

let alcoholCategories = [
  "Daily",
  "Occasionally (1-2 times/week)",
  "Rarely (a few times/month)",
  "Regularly (3-5 times/week)",
  "Never",
];

result.push(makeLegend(selectedVariable));

let chartsContainer = html`
  <div
    style="display: flex; flex-wrap: wrap; gap: 20px; justify-content: flex-start;"
  >
    ${alcoholCategories
      .map((alcohol) => {
        let subset = data.filter((d) => d.alcohol_frequency === alcohol);
        let total = subset.length;

        if (total === 0) return null; // Skip if no data

        let parts = Array.from(
          d3.group(subset, (d) => d[selectedVariable]),
          ([key, values]) => ({
            label: key,
            value: values.length,
            percentage: values.length / total,
          }),
        );

        let sortedParts = categoryOrders[selectedVariable].map((label) => {
          let found = parts.find((p) => p.label === label);
          return found || { label: label, value: 0, percentage: 0 };
        });

        let grid = makeWafelChartMulti(sortedParts, 100, selectedVariable);

        return html`
          <div
            style="margin-bottom: 1em; min-width: 130px; max-width: 130px; display: flex; flex-direction: column;"
          >
            <div style="height: 40px; display: flex; align-items: center;">
              <h5 style="margin: 0; font-size: 14px;">${alcohol}</h5>
            </div>
            <svg width="110" height="110">
              ${grid.map(
                (cell) => svg`
                <rect x="${cell.col * 10}" y="${cell.row * 10}" width="9" height="9"
                  fill="${kleurensets[selectedVariable](cell.label)}" />
              `,
              )}
            </svg>
          </div>
        `;
      })
      .filter((chart) => chart !== null)}
  </div>
`;

result.push(chartsContainer);
```

<div class="grid grid-cols-1">
  <div class="card">
    ${result}
  </div>
</div>
