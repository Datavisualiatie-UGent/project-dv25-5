import * as d3 from "d3";
import * as topojson from "topojson-client";
import * as Plot from "@observablehq/plot";
const us = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");

const stateAbbreviationMap = {
  'Alabama': 'AL',
  'Alaska': 'AK',
  'Arizona': 'AZ',
  'Arkansas': 'AR',
  'California': 'CA',
  'Colorado': 'CO',
  'Connecticut': 'CT',
  'Delaware': 'DE',
  'Florida': 'FL',
  'Georgia': 'GA',
  'Hawaii': 'HI',
  'Idaho': 'ID',
  'Illinois': 'IL',
  'Indiana': 'IN',
  'Iowa': 'IA',
  'Kansas': 'KS',
  'Kentucky': 'KY',
  'Louisiana': 'LA',
  'Maine': 'ME',
  'Maryland': 'MD',
  'Massachusetts': 'MA',
  'Michigan': 'MI',
  'Minnesota': 'MN',
  'Mississippi': 'MS',
  'Missouri': 'MO',
  'Montana': 'MT',
  'Nebraska': 'NE',
  'Nevada': 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  'Ohio': 'OH',
  'Oklahoma': 'OK',
  'Oregon': 'OR',
  'Pennsylvania': 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  'Tennessee': 'TN',
  'Texas': 'TX',
  'Utah': 'UT',
  'Vermont': 'VT',
  'Virginia': 'VA',
  'Washington': 'WA',
  'West Virginia': 'WV',
  'Wisconsin': 'WI',
  'Wyoming': 'WY'
}

export function AlcoholPercentageMap(gut) {
  const colorScale = d3.scaleQuantize([0, 100], d3.schemeBlues[9]);
  const alcoholByState = new Map(
    d3
      .rollups(
        gut, // Replace `gut` with your dataset
        (v) => d3.mean(v, (d) => (d.alcohol_consumption === true ? 1 : 0)) * 100,
        (d) => d.state
      )
      .map(([state, percentage]) => [state, percentage])
  );

  const width = 960;
  const height = 600;

  const svg = d3.create("svg").attr("viewBox", [0, 0, width, height]);

  const projection = d3.geoAlbersUsa().scale(1280).translate([width / 2, height / 2]);
  const path = d3.geoPath(projection);

  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid black")
    .style("padding", "3px") 
    .style("border-radius", "5px") 
    .style("font-family", "sans-serif")
    .style("font-size", "12px")
    .style("color", "#333") 
    .style("pointer-events", "none")
    .style("visibility", "hidden");

  svg
  .append("g")
  .selectAll("path")
  .data(topojson.feature(us, us.objects.states).features)
  .join("path")
  .attr("fill", (d) => {
    const percentage = alcoholByState.get(stateAbbreviationMap[d.properties.name]);
    return percentage != null ? colorScale(percentage) : "#ccc"; // Default color for missing data
  })
  .attr("d", path)
  .on("mouseover", (event, d) => {
    const percentage = alcoholByState.get(stateAbbreviationMap[d.properties.name]);
    tooltip
      .style("visibility", "visible")
      .html(
        `<strong>${d.properties.name}</strong><br>` +
        `${percentage != null ? percentage.toFixed(2) : "No data"}% alcohol consumers`
      );
  })
  .on("mousemove", (event) => {
    tooltip
      .style("top", `${event.pageY + 10}px`)
      .style("left", `${event.pageX + 10}px`);
  })
  .on("mouseout", () => {
    tooltip.style("visibility", "hidden");
  });

  svg
    .append("path")
    .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-linejoin", "round")
    .attr("d", path);

  return svg.node();
}


export function alcoholByGenderChart(gut) {
  // calculate percentages 
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
      sex,
      percentage: (consumed / total) * 100,
      ageGroup: +ageGroup,
      ageLabel: `${ageGroup}s`, // formatted label
      consumed,
      total
    };
  });

  // sort by age group
  alcoholByAgeGenderPercentData.sort((a, b) => a.ageGroup - b.ageGroup);

  // get unique age groups
  const ageGroups = [...new Set(alcoholByAgeGenderPercentData.map(d => d.ageGroup))];
  const genders = ["female", "male"];
  const colors = {"female": "pink", "male": "skyblue"};

  // set up dimensions
  const width = 800;
  const height = 400;
  const margin = {top: 30, right: 80, bottom: 50, left: 60};
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // create SVG
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height);

  // tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "alcohol-tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid black")
    .style("border-radius", "3px")
    .style("padding", "5px")
    .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
    .style("font-family", "sans-serif")
    .style("font-size", "12px")
    .style("color", "#333")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("z-index", 999);

  // group for the main chart area
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // set up scales
  const xScale = d3.scaleBand()
    .domain(ageGroups.map(age => `${age}s`))
    .range([0, innerWidth])
    .paddingInner(0.3)
    .paddingOuter(0.2);

  const xSubScale = d3.scaleBand()
    .domain(genders)
    .range([0, xScale.bandwidth()])
    .padding(0.1);

  const yScale = d3.scaleLinear()
    .domain([0, 100])
    .range([innerHeight, 0])
    .nice();

  // add x axis
  g.append("g")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(xScale))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick text").attr("fill", "white"));

  // x axis label
  g.append("text")
    .attr("class", "x-label")
    .attr("text-anchor", "middle")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 40)
    .attr("fill", "white")
    .text("age group");

  // add y axis
  g.append("g")
    .call(d3.axisLeft(yScale)
    .ticks(10)
    .tickFormat(d => d + "%"))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick text").attr("fill", "white"))
    .call(g => g.selectAll(".tick line")
    .clone()
    .attr("x2", innerWidth)
    .attr("stroke-opacity", 0.1));

  // y axis label
  g.append("text")
    .attr("class", "y-label")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -45)
    .attr("fill", "white")
    .text("% alcohol consumers");

  // add bars
  g.selectAll(".age-group")
    .data(ageGroups)
    .join("g")
    .attr("class", "age-group")
    .attr("transform", d => `translate(${xScale(`${d}s`)}, 0)`)
    .selectAll(".bar")
    .data(ageGroup => {
      return genders.map(gender => {
        const match = alcoholByAgeGenderPercentData.find(d => 
          d.ageGroup === ageGroup && d.sex === gender);
        return {
          ageGroup,
          ageLabel: `${ageGroup}s`,
          sex: gender,
          percentage: match ? match.percentage : 0,
          consumed: match ? match.consumed : 0,
          total: match ? match.total : 0
        };
      });
    })
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => xSubScale(d.sex))
    .attr("width", xSubScale.bandwidth())
    .attr("y", d => yScale(d.percentage))
    .attr("height", d => innerHeight - yScale(d.percentage))
    .attr("fill", d => colors[d.sex])
    .on("mouseover", function(event, d) {
      d3.select(this).attr("opacity", 0.8);
      tooltip.transition()
        .duration(100)
        .style("opacity", 1);
      
      tooltip.html(`
        <div>
          <div><strong>Age:</strong> ${d.ageLabel}</div>
          <div><strong>Gender:</strong> ${d.sex.charAt(0).toUpperCase() + d.sex.slice(1)}</div>
          <div><strong>Alcohol consumers:</strong> ${d.percentage.toFixed(1)}%</div>
          <div style="color: #777; font-size: 10px;">(${d.consumed}/${d.total} participants)</div>
        </div>`)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("opacity", 1);
      tooltip.transition()
        .duration(100)
        .style("opacity", 0);
    });

  // add legend
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);

  legend.selectAll(".legend-item")
    .data(genders)
    .join("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 25})`)
    .call(g => {
      g.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => colors[d]);
        
      g.append("text")
        .attr("x", 20)
        .attr("y", 12.5)
        .attr("fill", "white")
        .attr("font-size", "15px") 
        .text(d => d);
    });

  return svg.node();
}


//////////////////////////////////////// unused older versions ////////////////////////////////////////

/**
 * const selectedAgeGroup = view(
 *   Inputs.select([10, 20, 30, 40, 50, 60, 70, 80, 90], { label: "selected age group" }),
 * );
 */
function alcoholByGenderChart2(gut, selectedAgeGroup) {
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


function alcoholByGenderChart3(gut) {
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
      sex,
      percentage: (consumed / total) * 100,
      ageGroup: `${ageGroup}s`
    };
  });

  return Plot.plot({
    margin: 60,
    x: {axis: null, label: "Age Group"},
    y: {
      label: "% alcohol consumers", 
      tickFormat: "s", 
      grid: true,
      domain: [0, 100]
    },
    color: {
      domain: ["female", "male"],
      range: ["pink", "skyblue"],
      legend: true
    },
    fx: {
      label: "age group",
    },
    marks: [
      Plot.barY(alcoholByAgeGenderPercentData, {
        x: "sex",
        y: "percentage",
        fill: "sex",
        fx: "ageGroup",
        sort: {fx: {value: "x"}}
      }),
      Plot.ruleY([0]),
      Plot.tip(
        alcoholByAgeGenderPercentData,
        Plot.pointerX({
          x: "sex",
          fx: "ageGroup",
          y: "percentage",
          title: (d) => {
            return [
              `Age: ${d.ageGroup}`,
              `Gender: ${d.sex}`,
              `Alcohol consumers: ${d.percentage.toFixed(1)}%`
            ].join("\n");
          },
          anchor: "bottom",
        }),
      ),
    ]
  });
}

function statesAlcoholPercentage() {
  const alcoholByState = d3
  .rollups(
    gut,
    (v) => d3.mean(v, (d) => (d.alcohol_consumption === true ? 1 : 0)) * 100,
    (d) => d.state,
  )
  .map(([state, percentage]) => ({ state, percentage }));

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
