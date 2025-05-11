import * as d3 from "d3";
import * as Plot from "@observablehq/plot";

const alcohol_order = [
  "Never",
  "Rarely (a few times/month)",
  "Occasionally (1-2 times/week)",
  "Regularly (3-5 times/week)",
  "Daily"
]

export function alcoholBmi(data_clean_am, {width} = {}) {
    const grouped = d3.rollups(
        data_clean_am,
        v => v.length,
        d => d.bmi_cat,
        d => d.alcohol_frequency
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
            padding: 0.5
        },
        x: {
            axis: null,
            label: "Alcohol frequency",
            domain: [
                "Never",
                "Rarely (a few times/month)",
                "Occasionally (1-2 times/week)",
                "Regularly (3-5 times/week)",
                "Daily"
            ],
            padding: 0.2
        },
        y: {
            label: "% of the population in category",
            domain: [0, 70],
            grid: true
        },
        color: {
            legend: true,
            label: "Alcohol frequency:",
            domain: [
                "Never",
                "Rarely (a few times/month)",
                "Occasionally (1-2 times/week)",
                "Regularly (3-5 times/week)",
                "Daily"
            ]
        },
        marks: [
            Plot.barY(alcohol_bmi_data_pct, {
                fx: "bmi",
                x: "alcohol",
                y: "percent",
                fill: "alcohol",
                tip: true,
                sort: {x: null, color: null, fx: {value: "-y", reduce: "sum"}}
            }),
            Plot.ruleY([0])
        ]
    })
}


export function alcoholBmiDiabetes(data_bool, showDiabetics, {width} = {}) {
    const data_filtered = data_bool.filter(d => d.bmi >= 17 && d.bmi <= 40);

    const marks = [
        // grid lines (subtle for dark backgrounds)
        Plot.ruleY([20, 24, 28, 32, 36, 40], {
            stroke: "#666666",
            strokeWidth: 0.8,
            strokeDasharray: "4 2"
        }),

        Plot.boxY(data_filtered, {
            x: "alcohol_frequency",
            y: "bmi",
            stroke: "white",  // dark stroke for contrast
            fill: "#4285F4",
            tip: false,
            jitter: true,
        }),
    ]

    if (showDiabetics) {
        marks.push(
            // diabetic points with outline
            Plot.dot(data_filtered.filter(d => d.diabetes_yes), {
                x: "alcohol_frequency",
                y: "bmi",
                fill: "#FF5252",
                stroke: "#000",   // black stroke for contrast
                strokeWidth: 0.5,
                r: 4,
                title: d => `Diabetic, BMI: ${d.bmi.toFixed(1)}`
            }),
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
            padding: 0.5  // separates x-axis labels
        },
        color: {
            legend: true,
            label: "Legend",
            domain: ["Diabetic"],
            range: ["#FF5252"],
            labelColor: "white"
        },
        style: {
            color: "white",
            fontSize: 12
        },
        marginBottom: 85,
        marginTop: 35,
        marginLeft: 40,
        marginRight: 20
    });
}

