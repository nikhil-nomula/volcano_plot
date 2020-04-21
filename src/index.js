import $ from 'jquery';
import * as volcanoPlot from './volcanoPlot';
import data from './data/data.json'
import 'bootstrap/dist/css/bootstrap.css';
import './css/style.css';

window.addEventListener("load", (event) => {

    let volcanoPlotOptions = {
      axisLabelFontSize: 12,
      color: "#900",
      gridOpacity: 0.5,
      /** How should the grid be displayed? */
      gridStyle: "dotted",
      height: 600,
      jitter: 8,
      marginBottom: 50,
      marginLeft: 60,
      marginRight: 20,
      marginTop: 10,
      /** Truncate the minimum y axis value. Values below this will be truncated. */
      minYValue: 1e-3,
      opacity: 0.5,
      radius: 2,
      significanceColorY: "#00008b",
      significanceLineStyleY: "none",
      significanceValueY: "0.05",
      significanceColorX: "#00008b",
      significanceLineStyleX: "solid",
      significanceValueX: 1,
      softColor: "black",
      tooltipOffset: 6,
      width: $(".container").width(),
      xAxisTickFormat: ".1f",
      yAxisTickFormat: ".3f",
      zoomMax: 5,
      zoomMin: 1 / 5,
    }
  
    volcanoPlot.initParams(volcanoPlotOptions, data);
    volcanoPlot.draw();

    $( window ).resize(function() {
      volcanoPlotOptions.width = $(".container").width();
      volcanoPlot.reset();
      volcanoPlot.draw();
    });

    $("nav ul li a[href^='#']").on('click', function(e) {

      // prevent default anchor click behavior
      e.preventDefault();
   
      // store hash
      var hash = this.hash;
   
      // animate
      $('html, body').animate({
          scrollTop: $(hash).offset().top
        }, 700, function(){
   
          // when done, add hash to url
          // (default click behaviour)
          window.location.hash = hash;
        });
   
   });
    

});

