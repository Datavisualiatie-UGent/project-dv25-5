import * as d3 from "d3";
import * as topojson from "topojson-client";
import * as Plot from "@observablehq/plot";
const us = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");

const validStates = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
]);

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

export function alcoholPercentageMap(gut, {width} = {}) {
  gut = gut.filter(
    (d) =>
      d.alcohol_consumption !== undefined &&
      d.alcohol_consumption !== null &&
      d.state &&
      validStates.has(d.state)
  );

  const samplesByState = d3
    .rollups(
      gut,
      (v) => v.length, // count the number of samples
      (d) => d.state, // group by state
    )
    .map(([state, count]) => ({ state, count })); // convert to array of objects

  const alcoholByState = new Map(
    d3
      .rollups(
        gut,
        (v) => d3.mean(v, (d) => (d.alcohol_consumption === true ? 1 : 0)) * 100,
        (d) => d.state
      )
      .map(([state, percentage]) => [state, percentage])
  );

  const percentages = Array.from(alcoholByState.values());

  // calculate actual min and max from data
  const minPercentage = d3.min(percentages) || 0;
  const maxPercentage = d3.max(percentages) || 100;

  // round min down and max up to nearest "nice" values for better color scale
  const colorMin = Math.max(0, Math.floor(minPercentage / 5) * 5);
  const colorMax = Math.min(100, Math.ceil(maxPercentage / 5) * 5);
  
  // create color scale with actual data range
  const colorScale = d3.scaleQuantize([colorMin, colorMax], d3.schemeBlues[7]);

  // set dimensions with padding
  const height = width * 0.60;
  const padding = { top: 0, right: 10, bottom: 45, left: 10 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // create SVG with proper dimensions
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);

  // create container group with padding
  const g = svg.append("g")
    .attr("transform", `translate(${padding.left},${padding.top})`);

  // set up projection scaled to inner dimensions
  const projection = d3.geoAlbersUsa()
    .scale(innerWidth * 1.2)
    .translate([innerWidth / 2, innerHeight / 2]);

  const path = d3.geoPath(projection);

  // create tooltip
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

  // add states with color based on data
  g.append("g")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.states).features)
    .join("path")
    .attr("fill", (d) => {
      const percentage = alcoholByState.get(stateAbbreviationMap[d.properties.name]);
      return percentage != null ? colorScale(percentage) : "#ccc"; // default color for missing data
    })
    .attr("d", path)
    .attr("stroke", "none") // default stroke
    .on("mouseover", function(event, d) {
      d3.select(this)
        .attr("stroke", "yellow")
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 1)
        .raise(); // bring to front
      
      const percentage = alcoholByState.get(stateAbbreviationMap[d.properties.name]);
      tooltip
        .style("visibility", "visible")
        .html(
          `<strong>${d.properties.name}</strong><br>` +
          `${percentage != null ? percentage.toFixed(2) : "No data"}% alcohol consumers<br>` +
          `<div style="color: #777; font-size: 11px;">based on ${samplesByState.find(s => s.state === stateAbbreviationMap[d.properties.name])?.count || 0} samples</div>`
        );
    })
    .on("mouseout", function() {
      // reset the state's appearance
      d3.select(this)
        .attr("stroke", "none");
      
      tooltip.style("visibility", "hidden");
    })
    .on("mousemove", (event) => {
      tooltip
        .style("top", `${event.pageY + 10}px`)
        .style("left", `${event.pageX + 10}px`);
    });

  // add state borders
  g.append("path")
    .datum(topojson.mesh(us, us.objects.states))
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 0.7)
    .attr("stroke-linejoin", "round")
    .attr("stroke-opacity", 0.7)
    .attr("d", path)
    .raise();

  // add legend
  const legendWidth = 200;
  const legendHeight = 15;
  const legendX = width - padding.right - legendWidth;
  const legendY = height - padding.bottom + 10;

  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .tickSize(legendHeight)
    .tickFormat(d => `${d}%`)
    .ticks(5);

  const legend = svg.append("g")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  // add color gradient
  const colorRange = colorScale.range();
  
  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "alcohol-gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

  colorRange.forEach((color, i) => {
    const offset = i / (colorRange.length - 1);
    linearGradient.append("stop")
      .attr("offset", `${offset * 100}%`)
      .attr("stop-color", color);
  });

  // add legend rectangle with gradient
  legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#alcohol-gradient)");

  // add legend axis
  legend.append("g")
    .call(legendAxis)
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").attr("stroke", "#333"))
    .call(g => g.selectAll(".tick text")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("y", 20)); // position below the gradient

  return svg.node();
}


export function alcoholByGenderChart(gut, selectedFrequency, {width} = {}) {
  gut = gut.filter(
    (d) =>
      d.alcohol_consumption !== undefined &&
      d.alcohol_consumption !== null &&
      d.age_years &&
      Math.floor(d.age_years / 10) * 10 >= 10 &&
      Math.floor(d.age_years / 10) * 10 < 90 &&
      (d.sex === "female" || d.sex === "male")
  );

  // calculate percentages - filtered by frequency if selected
  const alcoholByAgeGenderPercent = gut
    .filter((d) => ((selectedFrequency === "All" && d.alcohol_consumption)|| d.alcohol_frequency === selectedFrequency))
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
  const colors = {"female": "#FF5252", "male": "#4285F4"};

  // set up dimensions
  const height = width * 0.5;
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
          <div><strong>Gender:</strong> ${d.sex}</div>
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

function alcoholByGenderChart4(gut, {width} = {}) {
  gut = gut.filter(
    (d) =>
      d.alcohol_consumption !== undefined &&
      d.alcohol_consumption !== null &&
      d.age_years &&
      d.alcohol_frequency && // Ensure frequency exists
      Math.floor(d.age_years / 10) * 10 >= 10 &&
      Math.floor(d.age_years / 10) * 10 < 90 &&
      (d.sex === "female" || d.sex === "male")
  );

  // Order frequencies from highest to lowest intensity
  const frequencyOrder = [
    "Daily", 
    "Regularly (3-5 times/week)", 
    "Occasionally (1-2 times/week)", 
    "Rarely (a few times/month)", 
  ];

  // Define frequency colors - using a blue scale
  const frequencyColors = {
    "Daily": "#e41a1c", // red
    "Regularly (3-5 times/week)": "#377eb8", // blue
    "Occasionally (1-2 times/week)": "#4daf4a", // green
    "Rarely (a few times/month)": "#984ea3", // purple
  };

  // Calculate data by age group, gender and frequency
  const grouped = d3.rollup(
    gut,
    v => v.length,
    d => Math.floor(d.age_years / 10) * 10, // Age group
    d => d.sex,                             // Gender
    d => d.alcohol_frequency                // Frequency
  );

  // Prepare data for visualization
  const data = [];
  
  // Process grouped data
  for (const [ageGroup, genderMap] of grouped) {
    for (const [gender, frequencyMap] of genderMap) {
      // Calculate total for this age-gender group
      let total = 0;
      for (const count of frequencyMap.values()) {
        total += count;
      }
      
      // Accumulate percentages for stacking
      let cumPercentage = 0;
      
      // Add data point for each frequency
      for (const freq of frequencyOrder) {
        const count = frequencyMap.get(freq) || 0;
        const percentage = (count / total) * 100;
        
        if (count > 0) {
          data.push({
            ageGroup,
            ageLabel: `${ageGroup}s`,
            gender,
            frequency: freq,
            percentage,
            count,
            total,
            startPercentage: cumPercentage,
            endPercentage: cumPercentage + percentage
          });
          
          cumPercentage += percentage;
        }
      }
    }
  }

  // Get unique age groups and sort them
  const ageGroups = [...new Set(data.map(d => d.ageGroup))].sort((a, b) => a - b);
  const genders = ["female", "male"];
  const genderColors = {"female": "#FF5252", "male": "#4285F4"};

  // Set up dimensions
  const height = width * 0.6; // Increased height ratio for better visibility
  const margin = {top: 50, right: 150, bottom: 50, left: 60};
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create SVG
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height);

  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .style("font-size", "16px")
    .text("Alcohol Consumption Frequency by Age Group and Gender");

  // Create tooltip
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

  // Group for the main chart area
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Set up scales
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

  // Add x axis
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
    .text("Age Group");

  // Add y axis
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
    .text("Percentage (%)");

  // Create nested groups for each age group
  const ageGroupG = g.selectAll(".age-group")
    .data(ageGroups)
    .join("g")
    .attr("class", "age-group")
    .attr("transform", d => `translate(${xScale(`${d}s`)}, 0)`);

  // Create columns for each gender within age groups
  const genderG = ageGroupG.selectAll(".gender")
    .data(ageGroup => genders.map(gender => ({ageGroup, gender})))
    .join("g")
    .attr("class", "gender")
    .attr("transform", d => `translate(${xSubScale(d.gender)}, 0)`);

  // Add frequency segments for each gender column
  genderG.each(function(genderData) {
    const genderGroup = d3.select(this);
    
    // Get data for this age-gender combination
    const segmentData = data.filter(d => 
      d.ageGroup === genderData.ageGroup && 
      d.gender === genderData.gender
    ).sort((a, b) => frequencyOrder.indexOf(a.frequency) - frequencyOrder.indexOf(b.frequency));
    
    // Add segments
    genderGroup.selectAll(".segment")
      .data(segmentData)
      .join("rect")
      .attr("class", "segment")
      .attr("x", 0)
      .attr("width", xSubScale.bandwidth())
      .attr("y", d => yScale(d.endPercentage))
      .attr("height", d => yScale(d.startPercentage) - yScale(d.endPercentage))
      .attr("fill", d => frequencyColors[d.frequency])
      .attr("stroke", "white")
      .attr("stroke-width", 0.5)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .attr("stroke-width", 2)
          .attr("stroke", "#ffeb3b");
          
        tooltip.transition()
          .duration(100)
          .style("opacity", 1);
          
        tooltip.html(`
          <div>
            <div><strong>Age:</strong> ${d.ageLabel}</div>
            <div><strong>Gender:</strong> ${d.gender}</div>
            <div><strong>Frequency:</strong> ${d.frequency}</div>
            <div><strong>Percentage:</strong> ${d.percentage.toFixed(1)}%</div>
            <div style="color: #777; font-size: 10px;">(${d.count}/${d.total} participants)</div>
          </div>`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("stroke-width", 0.5)
          .attr("stroke", "white");
          
        tooltip.transition()
          .duration(100)
          .style("opacity", 0);
      });
  });

  // Add legend for genders
  const genderLegend = svg.append("g")
    .attr("class", "gender-legend")
    .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);

  genderLegend.append("text")
    .attr("x", 0)
    .attr("y", -10)
    .attr("fill", "white")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Gender");

  genderLegend.selectAll(".gender-legend-item")
    .data(genders)
    .join("g")
    .attr("class", "gender-legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 25})`)
    .call(g => {
      g.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => genderColors[d]);
        
      g.append("text")
        .attr("x", 20)
        .attr("y", 12.5)
        .attr("fill", "white")
        .attr("font-size", "12px") 
        .text(d => d);
    });

  // Add legend for frequencies
  const freqLegend = svg.append("g")
    .attr("class", "freq-legend")
    .attr("transform", `translate(${width - margin.right + 10}, ${margin.top + 70})`);

  freqLegend.append("text")
    .attr("x", 0)
    .attr("y", -10)
    .attr("fill", "white")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Frequency");

  freqLegend.selectAll(".freq-legend-item")
    .data(frequencyOrder)
    .join("g")
    .attr("class", "freq-legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 25})`)
    .call(g => {
      g.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => frequencyColors[d]);
        
      g.append("text")
        .attr("x", 20)
        .attr("y", 12.5)
        .attr("fill", "white")
        .attr("font-size", "12px") 
        .text(d => d);
    });

  return svg.node();
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
