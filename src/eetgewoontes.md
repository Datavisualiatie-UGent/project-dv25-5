# Eetgewoontes

```js
let data = await FileAttachment("data/data_am_numeric.csv").csv({ typed: true });
```

```js
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

  multivitamin: d3.scaleOrdinal().domain([true, false]).range(["#b2df8a", "#33a02c"]),
};

function makeWafelChartMulti(categories, size = 100) {
  let blocks = [];
  let start = 0;

  categories.forEach((c) => {
    const count = Math.round(c.percentage * size);
    for (let i = 0; i < count; i++) {
      const index = start + i;
      blocks.push({
        label: c.label,
        row: Math.floor(index / 10),
        col: index % 10,
      });
    }
    start += count;
  });

  return blocks;
}

function makeLegend(variable) {
  let legendData = [];

  if (variable === "gluten") {
    legendData = [
      { label: "I do not eat gluten because it makes me feel bad", color: "#66c2a5" },
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
      { label: "true", color: "#b2df8a" },
      { label: "false", color: "#33a02c" },
    ];
  }

  return html`
    <div style="margin-top: 10px; margin-bottom: 20px;">
      <h5>Legende voor ${variable.charAt(0).toUpperCase() + variable.slice(1)}</h5>
      <svg width="500" height="${legendData.length * 20}">
        ${legendData.map(
          (entry, index) => svg`
          <rect x="0" y="${index * 20}" width="15" height="15" fill="${entry.color}" />
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
    label: "Kies variabele",
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

// Voeg legende toe voor de geselecteerde variabele
result.push(makeLegend(selectedVariable));

for (let alcohol of alcoholCategories) {
  let subset = data.filter((d) => d.alcohol_frequency === alcohol);

  let total = subset.length;

  let parts = Array.from(
    d3.group(subset, (d) => d[selectedVariable]),
    ([key, values]) => ({
      label: key,
      value: values.length,
      percentage: values.length / total,
    }),
  );

  let grid = makeWafelChartMulti(parts);

  result.push(html`
    <div style="margin-bottom: 2em">
      <h4>${alcohol}</h4>
      <svg width="110" height="110">
        ${grid.map(
          (cell) => svg`
            <rect x="${cell.col * 10}" y="${cell.row * 10}" width="9" height="9"
              fill="${kleurensets[selectedVariable](cell.label)}" />
          `,
        )}
      </svg>
    </div>
  `);
}
```

${result}
