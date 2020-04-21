import * as d3 from 'd3';
import $ from 'jquery';

let drawOptions = {};

let treatmentOptions = {
  "pbo": "Placebo",
  "low":  "Low Dose",
  "high": "High Dose"
}

let svg = null;

export function initParams(volcanoPlotOptions, data) {
  drawOptions.volcanoPlotOptions = volcanoPlotOptions;
  drawOptions.data = data;
  drawOptions.title = data[0].title;
  
  $("#hdrTtl").html("Visualization");

  svg = initializeSvg();
  
  initializeTreatments();
  initializeSOC();
  bindEvents();
  showNoOccurrenceAlert(false);
}



export function draw() {
  
  reset();

  
  let gView = svg.append("g")
            .classed("view", true)
            .attr("transform", `translate(${drawOptions.volcanoPlotOptions.marginLeft}, ${drawOptions.volcanoPlotOptions.marginTop})`)

  let gData = gView.append("g")
      .classed("data", true)
      .attr("transform", "translate(0, 0) scale(1)");

  let xScale = drawXAxis();
  let yScale = drawYAxis();

  let circles = drawCircles(xScale, yScale);
  
  addTooltip(circles);
  addLasso(gData, xScale, yScale);

  let selected = getFilteredData().some(d=>d.selected);
  showNoOccurrenceAlert(!selected);

  circles.raise();

}

function initializeSvg() {
  return d3.select("#volcano-plot")
      .attr("width", drawOptions.volcanoPlotOptions.width)
      .attr("height", drawOptions.volcanoPlotOptions.height)
      .attr("viewBox", `0 0 ${drawOptions.volcanoPlotOptions.width} ${drawOptions.volcanoPlotOptions.height}`);
  
}

function initializeTreatments() {
  let options = [
      { key: "low_pbo",  value: "" },
      { key: "high_pbo", value: "" },
  ];
  options = options
      .map(o => {
          let parts = o.key.split("_");
          let part1 = parts[0];
          let part2 = parts[1];
          o.value = `${treatmentOptions[part1]} vs. ${treatmentOptions[part2]}`;
          return o;
      });
  let optionsString = options.map(o => `<option value="${o.key}">${o.value}</option>`).join("\n");
  $("#treatment-comparison").append(optionsString);
  $("#treatment-comparison").val(options[0].key);
}

function initializeSOC() {
  let options = drawOptions.data
  .filter(d => !!d.soc)
  .map(d => d.soc || "")
  .reduce((prev, curr) => {
      if (prev.indexOf(curr) === -1) {
          prev.push(curr);
      }
      return prev;
  }, [])
  .sort()
  .map(s => `<option value="${s}">${s}</option>`)
  .join("\n");

// Create our options string. This will be appended to the select list.
// By default, the first (empty) option should be selected.
  let optionsString = '<option value="" selected>All</option>';
  optionsString += options;
  $("#system-organ-class").append(optionsString);
}

export function reset() {
  if(svg != null) {
    svg.selectAll("*").remove();
    $("#selected-data").hide();
    $("#table-footnote").hide();
  }
}

function bindEvents() {
  $("select").on("change", (e) => {
    e.preventDefault();
    reset();
    draw();
  });
}

function showNoOccurrenceAlert(show) {
  if (show) {
    $("#no-occurrence").show();
  }
  else {
    $("#no-occurrence").hide();
  }
}

function drawXAxis() {
  // Create the x scale.
  let x = d3.scaleLinear()
      .domain([0.1, getMaxOddsRatio()])
      .range([0, getPlotInnerWidth()])
      .nice();

  // Draw the x axis.
  let xAxis = svg
      .append("g")
      .classed("axis x-axis", true)
      .attr("transform", `translate(${drawOptions.volcanoPlotOptions.marginLeft}, ${drawOptions.volcanoPlotOptions.height - drawOptions.volcanoPlotOptions.marginBottom})`)
      .call(d3.axisBottom(x).ticks(10, drawOptions.volcanoPlotOptions.xAxisTickFormat));

  // Draw the x axis label.
  svg
      .append("text")
      .classed("axis-label x-axis-label", true)
      .attr("transform", `translate(${drawOptions.volcanoPlotOptions.marginLeft + (getPlotInnerWidth()/2)}, ${drawOptions.volcanoPlotOptions.height - drawOptions.volcanoPlotOptions.axisLabelFontSize})`)
      .attr("font-size", drawOptions.volcanoPlotOptions.axisLabelFontSize)
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text("Odds Ratio");


  if (drawOptions.volcanoPlotOptions.significanceValueX) {
      let opacity = +(xAxis.select("g.tick").attr("opacity"));
      let lineY2  = +(xAxis.select("g.tick").select("line").attr("y2"));

      let textY   = +(xAxis.select("g.tick").select("text").attr("y")) - 9;
      let textDX  = xAxis.select("g.tick").select("text").attr("dx") + 17;

      let xPos = x(drawOptions.volcanoPlotOptions.significanceValueX);

      let tick = xAxis.append("g")
          .classed("tick alpha-tick", true)
          .attr("opacity", opacity)
          .attr("transform", `translate(${xPos},0)`);

      tick.append("line")
          .attr("stroke", drawOptions.volcanoPlotOptions.significanceColorX)
          .attr("y2", lineY2);

      // If the options indicate that a significance line should be
      // drawn, then draw the line.
      if (drawOptions.volcanoPlotOptions.significanceLineStyleX !== "none") {
          let dasharray = getStrokeDashArray(drawOptions.volcanoPlotOptions.significanceLineStyleX);

          // Draw the significance line, if necessary.
          svg.select("g.data")
              .append("line")
              .attr("stroke", drawOptions.volcanoPlotOptions.significanceColorX)
              .attr("stroke-width", 2)
              .attr("stroke-dasharray", dasharray)
              .attr("x1", xPos )
              .attr("x2", xPos )
              .attr("y1", 0)
              .attr("y2", getPlotInnerHeight());
      }
  }

  if (drawOptions.volcanoPlotOptions.gridStyle !== "none") {
      let dasharray = getStrokeDashArray(drawOptions.volcanoPlotOptions.gridStyle);

      let grid = svg.append("g")
          .classed("grid x-grid", true)
          .attr("transform", `translate(${drawOptions.volcanoPlotOptions.marginLeft}, ${drawOptions.volcanoPlotOptions.height - drawOptions.volcanoPlotOptions.marginBottom})`)
          .call(d3.axisBottom(x).ticks(10).tickSize(-1 * getPlotInnerHeight()));

      grid.select(".domain").remove();
      grid.selectAll("text").remove();
      grid.selectAll("g.tick").attr("opacity", drawOptions.volcanoPlotOptions.gridOpacity);
      grid.selectAll("line").style("stroke-dasharray", dasharray);
  }

  return x;
}

function drawYAxis() {
  // Create the y scale.
  let y = d3.scaleLog()
      .domain([drawOptions.volcanoPlotOptions.minYValue, 1])
      .range([0, getPlotInnerHeight()])
      .nice();

  // Draw the y axis.
  let yAxis = svg
      .append("g")
      .classed("axis-label y-axis-label", true)
      .attr("transform", `translate(${drawOptions.volcanoPlotOptions.marginLeft}, ${drawOptions.volcanoPlotOptions.marginTop})`)
      .call(d3.axisLeft(y).ticks(10, drawOptions.volcanoPlotOptions.yAxisTickFormat));

  // Draw the y axis label.
  svg
      .append("text")
      .classed("axis-label y-axis-label", true)
      .attr("transform", `translate(${drawOptions.volcanoPlotOptions.axisLabelFontSize}, ${drawOptions.volcanoPlotOptions.marginTop + getPlotInnerHeight()/2}) rotate(-90)`)
      .attr("font-size", drawOptions.volcanoPlotOptions.axisLabelFontSize)
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text("p-value");

  // If a significance value exists in the options, then draw that
  // significance value.
  if (drawOptions.volcanoPlotOptions.significanceValueY) {
      let opacity = +(yAxis.select("g.tick").attr("opacity"));
      let lineX2  = +(yAxis.select("g.tick").select("line").attr("x2"));
      let textX   = +(yAxis.select("g.tick").select("text").attr("x"));
      let textDY  = yAxis.select("g.tick").select("text").attr("dy");

      let yPos = y(drawOptions.volcanoPlotOptions.significanceValueY) + 0.50;

      let tick = yAxis.append("g")
          .classed("tick alpha-tick", true)
          .attr("opacity", opacity)
          .attr("transform", `translate(0, ${yPos})`);

      tick.append("line")
          .attr("stroke", drawOptions.volcanoPlotOptions.significanceColorY)
          .attr("x2", lineX2);

      tick.append("text")
          .attr("fill", "#900")
          .attr("x", textX)
          .attr("dy", textDY)
          .attr("font-weight", "bold")
          .text(d3.format(drawOptions.volcanoPlotOptions.yAxisTickFormat)(drawOptions.volcanoPlotOptions.significanceValueY));

      // If the options indicate that a significance line should be
      // drawn, then draw the line.
      if (drawOptions.volcanoPlotOptions.significanceLineStyleY !== "none") {
          let dasharray = getStrokeDashArray(drawOptions.volcanoPlotOptions.significanceLineStyleY);

          // Draw the significance line, if necessary.
          svg.select("g.data")
              .append("line")
              .attr("stroke", drawOptions.volcanoPlotOptions.significanceColorY)
              .attr("stroke-dasharray", dasharray)
              .attr("x1", 0)
              .attr("x2", getPlotInnerWidth())
              .attr("y1", yPos)
              .attr("y2", yPos);
      }
  }

  if (drawOptions.volcanoPlotOptions.gridStyle !== "none") {
      let dasharray = getStrokeDashArray(drawOptions.volcanoPlotOptions.gridStyle);

      let grid = svg.append("g")
          .classed("grid x-grid", true)
          .attr("transform", `translate(${drawOptions.volcanoPlotOptions.marginLeft}, ${drawOptions.volcanoPlotOptions.marginTop})`)
          .call(d3.axisLeft(y).ticks(10).tickSize(-1 * getPlotInnerWidth()));

      grid.select(".domain").remove();
      grid.selectAll("text").remove();
      grid.selectAll("g.tick").attr("opacity", drawOptions.volcanoPlotOptions.gridOpacity);
      grid.selectAll("line").style("stroke-dasharray", dasharray);
  }

  return y;
}

function getMaxOddsRatio() {
  const defaultValue = 0.0;
  let maxValue = drawOptions.data.reduce((previous, current) => {
    return Math.max(previous, (current.low_pbo_or || defaultValue), (current.high_pbo_or || defaultValue));
  }, defaultValue);

  return maxValue;
}

function getPlotInnerWidth() {
  return drawOptions.volcanoPlotOptions.width - drawOptions.volcanoPlotOptions.marginLeft - drawOptions.volcanoPlotOptions.marginRight;
}

function getPlotInnerHeight() {
  return drawOptions.volcanoPlotOptions.height - drawOptions.volcanoPlotOptions.marginTop - drawOptions.volcanoPlotOptions.marginBottom;
}

function getStrokeDashArray(value) {
  switch (value) {
  case "dashed":
      return "3 2";
  case "dotted":
      return "1 2";
  default:
      return "none";
  }
}

function drawCircles(xScale, yScale) {
  let gData = svg.select("g.data");

  let circles = gData.selectAll("circle")
      .data(getFilteredData())
      .join("circle")
      .classed("datum", true)
      .attr("cx", d => {
        let b = getOddsRatioColumn();
        return xScale((d)[getOddsRatioColumn()]) + randomJitter()
      })
      .attr("cy", d => yScale((d)[getPValueColumn()]) + randomJitter())
      .attr("r", d => Math.sqrt((d)[getCountColumn()]) * drawOptions.volcanoPlotOptions.radius)
      .attr("fill", d => d.selected ? drawOptions.volcanoPlotOptions.color : "black")
      .attr("opacity", d => d.selected ? drawOptions.volcanoPlotOptions.opacity : 0.04)
      .attr("stroke", d => d.selected ? d3.rgb(drawOptions.volcanoPlotOptions.color).darker(1.0).toString() : "none")
      .attr("stroke-width", d => d.selected ? 1 : 0)
      .attr("stroke-opacity", 1.0)
      .attr("data-n", d => d.total_n)
      .attr("data-selected", d => d.selected)
      .attr("data-soc", d => d.soc || "");

  return circles;
}

function getFilteredData() {
  const oddsRatio = getOddsRatioColumn();
  const pValue = getPValueColumn();
  const soc = $("#system-organ-class").val();

  const hasMatchingSOC = (datum) => {
      if (!soc) {
          return true;
      }
      if (!datum.soc) {
          return true;
      }
      return (soc === datum.soc);
  };

  const isValid = (datum) => {
      let anyDatum = datum;
      return !!anyDatum[oddsRatio] && !!anyDatum[pValue];
  };

  const updateYValue = (datum) => {
      let anyDatum = datum ;
      anyDatum[pValue] = (anyDatum[pValue] < drawOptions.volcanoPlotOptions.minYValue) ? drawOptions.volcanoPlotOptions.minYValue : anyDatum[pValue] ;
      return datum;
  };

  const updateSelected = (datum) => {
      datum.selected = hasMatchingSOC(datum);
      return datum;
  }

  // Filter data whose rows are valid, and map all rows and add selected to the datum if it matches soc value. 
  // If its all, investigate how it works
  // Updating Y Value to make sure that its not less than Y value, if it is, then its value is changed to min Y Value. 
  return drawOptions.data
      .filter(d => isValid(d))
      .map(d => updateSelected(d))
      .map(d => updateYValue(d));
}

function getOddsRatioColumn() {
  let value = $("#treatment-comparison").val();
  return `${value}_or`;
}

function getPValueColumn() {
  let value = $("#treatment-comparison").val();
  return `${value}_pval`;
}

function getCountColumn() {
  return "total_n";
}

function randomJitter() {
  if (drawOptions.volcanoPlotOptions.jitter > 0) {
      return (-1 * drawOptions.volcanoPlotOptions.jitter) + Math.random() * 2 * drawOptions.volcanoPlotOptions.jitter;
  }
  return 0;
}

function addTooltip(circles) {
  circles.on("mouseover", () => {
    let target = d3.select(d3.event.target);
    let datum = target.datum();
    let anyDatum = datum;
    let tooltipText = [
        datum.term,
        `Odds Ratio: ${anyDatum[getOddsRatioColumn()]}`,
        `p-value: ${anyDatum[getPValueColumn()]}`,
    ];

    let trt1 =  getComparedTreaments()[0];;
    let trt2 = getComparedTreaments()[1];


    tooltipText.splice(3, 0,
        `${treatmentOptions[trt1]}: ${anyDatum[trt1 + "_n"]} (${anyDatum[trt1 + "_percent"]}%)`,
        `${treatmentOptions[trt2]}: ${anyDatum[trt2 + "_n"]} (${anyDatum[trt2 + "_percent"]}%)`);

    let top = d3.event.pageY + drawOptions.volcanoPlotOptions.tooltipOffset;
    let left = d3.event.pageX + drawOptions.volcanoPlotOptions.tooltipOffset;
    $("#tooltip")
        .css("top", `${top}px`)
        .css("left", `${left}px`)
        .html(tooltipText.join("<br>"))
        .show();
  })
  .on("mouseout", () => {
    $("#tooltip").hide();
  }); 
}

function getComparedTreaments() {
  let value = ($("#treatment-comparison").val() || "").toString();
  let split = value.split("_");
  let val1 = split[0] || "";
  let val2 = split[1] || "";
  return [val1, val2];
}

function addLasso(g, x, y) {
  let brush = d3.brush()
              .on("end", () => {
                  if (d3.event.selection) {

                      const isBetween = (value, index) => {
                          return d3.event.selection[0][index] <= value && value <= d3.event.selection[1][index];
                      };

                      const isSelected = (datum) => {
                          let anyDatum = datum;
                          let xValue = anyDatum[getOddsRatioColumn()];
                          let yValue = anyDatum[getPValueColumn()];
                          return datum.selected && isBetween(x(xValue), 0) && isBetween(y(yValue), 1);
                      };

                      let selectedData = getFilteredData().filter(d => isSelected(d));
                      if (selectedData && selectedData.length) {
                          let headColumns = [
                              "System Organ Class",
                              "Preferred Term",
                              "Odds Ratio",
                              "p-value",
                          ];
                          let dataColumns = [
                              "soc",
                              "term",
                              getOddsRatioColumn(),
                              getPValueColumn(),
                          ]

                          let trt1 = getComparedTreaments()[0];
                          let trt2 = getComparedTreaments()[1];


                          headColumns.splice(4, 0,
                              treatmentOptions[trt1] + " n",
                              treatmentOptions[trt1] + " %",
                              treatmentOptions[trt2] + " n",
                              treatmentOptions[trt2] + " %");

                          dataColumns.splice(4, 0,
                              trt1 + "_n",
                              trt1 + "_percent",
                              trt2 + "_n",
                              trt2 + "_percent");

                          let headContent = `<tr>${headColumns.map(col => `<th>${col}</th>`).join("")}</tr>`;
                          let bodyContent = selectedData.map(datum => `<tr>${dataColumns.map(col => `<td ${typeof (datum)[col] === "number" ? 'style="text-align: left;"' : ''}>${(datum)[col]}</td>`)}</tr>`).join("");
                          $("#selected-data").show();
                          $("#selected-data-head").html(headContent);
                          $("#selected-data-body").html(bodyContent);
                          $("#table-footnote").show();
                      }
                      else {
                          $("#selected-data").hide();
                          $("#table-footnote").hide();
                      }
                  }
                  else {
                      $("#selected-data").hide();
                      $("#table-footnote").hide();
                  }
              });
          g.call(brush);
}