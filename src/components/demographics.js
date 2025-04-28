import * as d3 from "d3";
import * as topojson from "topojson-client";
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

const colorScale = d3.scaleQuantize([0, 100], d3.schemeBlues[9]);

export function AlcoholPercentageMap(gut) {
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
    .style("padding", "3px") // Reduced padding
    .style("border-radius", "3px") // Smaller border radius
    .style("font-size", "12px") // Smaller font size
    .style("color", "#333") // Darker text color
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
        `${percentage != null ? percentage.toFixed(2) : "No data"}% Alcohol Consumers`
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
