import * as d3 from "d3";
import { alcoholColors, alcohol_order } from "./health.js";

export function radarChart(data, { width } = {}) {
  const averagePerAlcohol = d3
    .groups(data, (d) => d.alcohol_frequency)
    .map(([alcoholLevel, group]) => {
      return {
        alcoholLevel: alcoholLevel,
        averages: {
          ex_numeric: d3.mean(group, (d) => d.ex_numeric),
          flos_numeric: d3.mean(group, (d) => d.flos_numeric),
          cos_numeric: d3.mean(group, (d) => d.cos_numeric),
          teeth_numeric: d3.mean(group, (d) => d.teeth_numeric),
          sleep_numeric: d3.mean(group, (d) => d.sleep_numeric),
        },
        visible: true, // Add visibility state
      };
    });

  // Change height and margins to reduce padding and add space at bottom for legend
  const height = width * 0.9;
  const margin = { top: 50, right: 60, bottom: 100, left: 60 };

  // Features for the radar chart
  const features = [
    "Exercise",
    "Flossing",
    "Cosmetic usage",
    "Teeth brushing",
    "Sleep",
  ];
  const featureCount = features.length;

  // Calculate radar chart dimensions
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const radius = Math.min(chartWidth, chartHeight) / 2;

  // Create scales
  const angleScale = d3
    .scaleLinear()
    .domain([0, featureCount])
    .range([0, 2 * Math.PI]);

  const radiusScale = d3
    .scaleLinear()
    .domain([0, 4]) // Values range from 0-4
    .range([0, radius]);

  // Function to calculate x,y coordinates from angle and radius
  const angleToCoordinate = (angle, value) => {
    const radian = angleScale(angle) - Math.PI / 2;
    return {
      x: radiusScale(value) * Math.cos(radian),
      y: radiusScale(value) * Math.sin(radian),
    };
  };

  // Create SVG
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("style", "width: 100%; height: auto;");

  // Create chart group
  const g = svg
    .append("g")
    .attr(
      "transform",
      `translate(${width / 2}, ${(height - margin.bottom + margin.top) / 2})`,
    );

  // Draw axis lines
  features.forEach((feature, i) => {
    const coord = angleToCoordinate(i, 4);

    // Draw axis line - Increased opacity and weight
    g.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", coord.x)
      .attr("y2", coord.y)
      .attr("stroke", "white")
      .attr("stroke-width", 1.2)
      .attr("opacity", 0.5);

    // Add axis label
    g.append("text")
      .attr("x", coord.x * 1.1)
      .attr("y", coord.y * 1.1)
      .attr("text-anchor", () => {
        if (coord.x < 0) return "end";
        if (coord.x > 0) return "start";
        return "middle";
      })
      .attr("dominant-baseline", () => {
        if (coord.y < 0) return "auto";
        if (coord.y > 0) return "hanging";
        return "middle";
      })
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("opacity", 0.9)
      .text(feature);
  });

  // Draw concentric circles for the levels
  [1, 2, 3, 4].forEach((level) => {
    g.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", radiusScale(level))
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 1.2)
      .attr("opacity", 0.4);

    // Add label for each level
    g.append("text")
      .attr("x", 0)
      .attr("y", -radiusScale(level))
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .attr("opacity", 1.0)
      .text(level.toString());
  });

  // Create line generator for the radar paths
  const lineGenerator = d3
    .lineRadial()
    .angle((d, i) => angleScale(i))
    .radius((d) => radiusScale(d))
    .curve(d3.curveLinearClosed);

  // Create a container for all radar paths
  const pathsContainer = g.append("g").attr("class", "paths-container");

  // Draw radar paths for each alcohol level
  averagePerAlcohol.forEach((d) => {
    const values = [
      d.averages.ex_numeric,
      d.averages.flos_numeric,
      d.averages.cos_numeric,
      d.averages.teeth_numeric,
      d.averages.sleep_numeric,
    ];

    // Create group for this alcohol level's elements
    const alcoholGroup = pathsContainer
      .append("g")
      .attr("class", `alcohol-group-${d.alcoholLevel.replace(/[^a-zA-Z0-9]/g, "-")}`)
      .attr("data-alcohol", d.alcoholLevel);

    // Draw the path
    alcoholGroup
      .append("path")
      .datum(values)
      .attr("d", lineGenerator)
      .attr("fill", "none") // No fill
      .attr("stroke", alcoholColors[d.alcoholLevel] || "#007AFF")
      .attr("stroke-width", 3.5);

    // Add dots at data points
    values.forEach((v, i) => {
      const coord = angleToCoordinate(i, v);
      alcoholGroup
        .append("circle")
        .attr("cx", coord.x)
        .attr("cy", coord.y)
        .attr("r", 4)
        .attr("fill", alcoholColors[d.alcoholLevel] || "#007AFF");
    });
  });

  // Create the legend at the bottom center
  const legendGroup = svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom * 0.8})`);

  // First, create all legend items
  const legend = legendGroup
    .selectAll(".legend")
    .data(alcohol_order)
    .enter()
    .append("g")
    .attr("class", "legend")
    .style("cursor", "pointer");

  // Add rectangles for color indicators
  legend
    .append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", (d) => alcoholColors[d] || "#007AFF");

  // Add text labels
  legend
    .append("text")
    .attr("x", 20)
    .attr("y", 12)
    .attr("fill", "white")
    .attr("font-size", "12px")
    .text((d) => d);

  // Calculate approximate text width based on character count
  const charWidth = 5;
  const baseWidth = 40;
  const rowHeight = 25;
  const availableWidth = width - margin.left / 2 - margin.right / 2; // Width available for legend

  // legend title
  legendGroup
    .append("text")
    .attr("class", "legend-title")
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", "14px")
    .attr("font-style", "italic")
    .attr("y", -10)
    .text("Alcohol consumption frequency");

  // Position legend items with multi-row wrapping
  let currentX = 0;
  let currentY = 10;
  let maxWidth = 0;

  legend.each(function (d, i) {
    // Calculate width based on text length
    const textLength = d.length;
    const itemWidth = baseWidth + textLength * charWidth;

    // Check if this item would exceed the available width
    if (currentX + itemWidth > availableWidth && currentX > 0) {
      // Move to next row
      currentY += rowHeight;
      currentX = 0;
    }

    // Position this item
    d3.select(this).attr("transform", `translate(${currentX}, ${currentY})`);

    // Update max width if needed
    maxWidth = Math.max(maxWidth, currentX + itemWidth);

    // Move position for next item
    currentX += itemWidth;
  });

  // Calculate total height of the legend
  const totalHeight = currentY + rowHeight;

  // Center the legend horizontally and position at bottom
  legendGroup.attr(
    "transform",
    `translate(${(width - maxWidth) / 2}, ${
      height - margin.bottom * 0.2 - totalHeight / 2
    })`,
  );

  legendGroup
    .select(".legend-title")
    .attr("text-anchor", "middle")
    .attr("x", maxWidth / 2) // Position at half the legend width
    .attr("y", -10);

  // Add click functionality
  legend.on("click", function (event, d) {
    const alcoholGroup = pathsContainer.select(
      `.alcohol-group-${d.replace(/[^a-zA-Z0-9]/g, "-")}`,
    );

    // Get current visibility state
    const visible = alcoholGroup.style("opacity") !== "0.1";

    // Toggle visibility
    alcoholGroup.style("opacity", visible ? 0.1 : 1);
    d3.select(this).style("opacity", visible ? 0.5 : 1);
  });

  return svg.node();
}
