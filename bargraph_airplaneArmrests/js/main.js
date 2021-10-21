//============================GLOBALS============================
/* you should define anything up here that stays static throughout your visualization. It is the design of your
visualization that determines if a variable/svg/axis/etc. should remain in the global space or should
be animated/updated etc. Typically, you will put things here that are not dependent on the data.
 */

// define margins in pixels. Use these to define total space allotted for this chart, within the chart area.
// For multiple charts, you can define multiple margin arrays
var margins = { left:80, right:80, top:60, bottom:170};

//define chart sizes
var width = 900 - margins.left - margins.right;
var height = 500 - margins.top - margins.bottom;

//grab entire body
//d3.select() grabs html objects and can modify them. Here you are designating a block of space
var g = d3.select("#chart-area")
//define the block size
    .append("svg")
    .attr("width", width + margins.left + margins.right)
    .attr("height", height + margins.top + margins.bottom)
    //define the chart location
    .append("g")
    .attr("transform", "translate(" + margins.left + ", " + margins.top  + ")");


// Title
g.append("text")
    .attr("class", "title")
    //position
    .attr("x", width / 2) //centered
    .attr("y",  -(margins.top / 2))
    //characteristics
    .attr("font-size", "20px")
    .attr("text-anchor", "middle")
    .attr("font-family", "Century Gothic,CenturyGothic,AppleGothic,sans-serif")
    .text("In a row of three seats, who should get to use the two arm rests?");

//define x axis-label

g.append("text")
    .attr("class", "x axis-label")
    //position
    .attr("x", width / 2) //centered
    .attr("y", height + (margins.bottom / 4))
    //characteristics
    .attr("font-size", "12px")
    .attr("text-anchor", "middle")
    .text("Percent Respondants");
    

//define y axis-label
g.append("text")
    .attr("class", "y axis-label")
    //position
    .attr("x", -height / 2)
    .attr("y", -60)
    //characteristics
    .attr("fons-size", "12px")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .text("Age Groups");

//========================Data Loading=======================
/* Load the raw data file, anything that's local gets worked with within this async function. d3 can handle these
three file types; csv, tsv, and json.
IMPORTANT: This call is new to D3 v5. You may need to modify code that you take from the internet for compatibility */

//d3.csv("data/revenues.csv").then(function(data){
//d3.tsv("data/revenues.tsv").then(function(data){
d3.json("data/armrest_seat.json").then(function(data){

    /*first thing to do is log the data. You can check this either in your debugger (recommend JetBrains WebStorm) or
    in your browser (recommend chrome) using the developer tools */
    console.log(data);

    //=====================Data Handling======================
    /* Work with the raw data here. Create a new array with modifiedData = {} if you need to. Apply filters to check for
    null values, etc...  */

    //convert to ints
    data.forEach(function(d){
        d.window_and_aisle = +d.window_and_aisle;
        d.other = +d.other;
        d.whoever_first = +d.whoever_first;
        d.middle_seat = +d.middle_seat;
        d.shared = +d.shared;
    });

    //log the data again to check it's correct format, especially if you create a new array
    //console.log(modifiedData);

    //=====================Data Joining========================
    /* The data is available here. This is where you work with objects that require a reference to the data. In this
    case that means the axis scales and the rectangle objects, but it could be any number of things, especially if
    you are creating a more dynamic viz. Much of this section can be moved into an update() function which you will
     use to define the dynamic objects of your viz. */

    //band scale for the y axis, returns a function object
    /*we are mapping a set of names to the width of the viz (using index)
    eg. january => width * (0/11), february => width * (1/11),... */
    // Reused for age buckets
    var y = d3.scaleBand() //ordinal
        .domain(data.map(function(d){ return d.age; })) //input: age
        .range([0, height])                                //output
        .paddingInner(0.4)
        .paddingOuter(0.4);

    //linear scale for the x-axis, returns a function object
    /* mapping the domain of profits to the range of height to 0.
    this is reversed because (0,0) is at the top left of the chart area, with positive y-axis pointing down */
    var x = d3.scaleLinear() //interval
        .domain([0, 100]) //input d3.max(data, function(d){ return d.shared })
        .range([0, width]);                                       //output

    //create axes, append them to the chart area
    var xAxisCall = d3.axisBottom(x)
    .ticks(10) //let d3 handle the ticks and text
    .tickSize(-height);
    g.append("g")
    //axis location
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxisCall)
        //text characteristics
        .selectAll("text")
        .attr("y", "10")
        .attr("x", "0")
        .attr("text-anchor", "middle");
        //.attr("transform", "rotate(-40)");

    // X axis color modifications:
    d3.selectAll(".x.axis line")
    .style("stroke-width","0.5")
    .style("stroke","grey");

    d3.selectAll(".x.axis path")
    .style("stroke","white");

    d3.selectAll(".x.axis text")
    .style("fill","grey");

    var yAxisCall = d3.axisLeft(y);
    g.append("g")
        .attr("class", "y-axis")
        .call(yAxisCall);

        // Lerps in and out of normalized data. For animations. 0 - 1
        norm_frac = 1.0;

        // normalize data
        data.forEach(function(d){
            // Compute the total
            tot = d.window_and_aisle + d.other + d.whoever_first + d.middle_seat + d.shared;
            d.window_and_aisle = ((1.0 - norm_frac) * d.window_and_aisle) + (norm_frac * (d.window_and_aisle / tot * 100));
            d.other = ((1.0 - norm_frac) * d.other) + (norm_frac * (d.other / tot * 100));
            d.whoever_first = ((1.0 - norm_frac) * d.whoever_first) + (norm_frac * (d.whoever_first / tot * 100));
            d.middle_seat = ((1.0 - norm_frac) * d.middle_seat) + (norm_frac * (d.middle_seat / tot * 100));
            d.shared = ((1.0 - norm_frac) * d.shared) + (norm_frac * (d.shared / tot * 100));
          })

    //gain access to all rectangles, even if there are none
    var rects = g.selectAll("rect")
        .data(data);

    //create new rectangles, with positions and sizes using our scale functions.
    /* in this case we only create the rectangles once because this is a static viz. when we get into dynamic viz
    we will need to handle not only the creation of the new rectangles, but the update or removal of old ones. */
    


    //window_and_aisle ************************************
    rects.enter()
    .append("rect")
    .attr("y", function(d){ return y(d.age); })
    .attr("x", function(d){ return x(0);} )
    .attr("height", y.bandwidth)
    .attr("width", function(d){ return x(d.window_and_aisle); })
    .attr("fill", '#FF7A1F');
    //other  **********************************************
    rects.enter()
    .append("rect")
    .attr("y", function(d){ return y(d.age); })
    .attr("x", function(d){ return x(d.window_and_aisle);} )
    .attr("height", y.bandwidth)
    .attr("width", function(d){ return x(d.other); })
    .attr("fill", '#E7E6E6');
    //whoever_first  **************************************
    rects.enter()
    .append("rect")
    .attr("y", function(d){ return y(d.age); })
    .attr("x", function(d){ return x(d.window_and_aisle + d.other);} )
    .attr("height", y.bandwidth)
    .attr("width", function(d){ return x(d.whoever_first); })
    .attr("fill", '#8FAADC');
    //middle_seat *****************************************
    rects.enter()
    .append("rect")
    .attr("y", function(d){ return y(d.age); })
    .attr("x", function(d){ return x(d.window_and_aisle + d.other + d.whoever_first);} )
    .attr("height", y.bandwidth)
    .attr("width", function(d){ return x(d.middle_seat); })
    .attr("fill", '#5C84CC');
    //shared **********************************************
    rects.enter()
        .append("rect")
        .attr("y", function(d){ return y(d.age); })
        .attr("x", function(d){ return x(d.window_and_aisle + d.other + d.whoever_first + d.middle_seat);} )
        .attr("height", y.bandwidth)
        .attr("width", function(d){ return x(d.shared); })
        .attr("fill", '#A5A5A5');


/*
        g.append("text")
    .attr("class", "x axis-label")
    //position
    .attr("x", width / 2) //centered
    .attr("y", height + (margins.bottom / 4))
    //characteristics
    .attr("font-size", "12px")
    .attr("text-anchor", "middle")
    .text("Percent Respondants");
*/

// Not quick, but dirty, legend:
legend_top_height = height + (margins.bottom / 2);
legend_spacing_vert = 25;
legend_spacing_horizontal = 200;

g.append("circle").attr("cx",200 - legend_spacing_horizontal).attr("cy",legend_top_height).attr("r", 6).style("fill", '#8FAADC');
g.append("text").attr("x", 220 - legend_spacing_horizontal).attr("y", legend_top_height).text("Whoever puts their arm on the arm rest first").style("font-size", "15px").attr("alignment-baseline","middle");

g.append("circle").attr("cx",200 - legend_spacing_horizontal).attr("cy",legend_top_height + legend_spacing_vert).attr("r", 6).style("fill", '#E7E6E6');
g.append("text").attr("x", 220 - legend_spacing_horizontal).attr("y", legend_top_height + legend_spacing_vert).text("Other (please specify)").style("font-size", "15px").attr("alignment-baseline","middle");

g.append("circle").attr("cx",200).attr("cy",legend_top_height  + legend_spacing_vert * 2).attr("r", 6).style("fill", '#FF7A1F');
g.append("text").attr("x", 220).attr("y", legend_top_height + legend_spacing_vert * 2).text("The people in the aisle and window seats get both arm rests").style("font-size", "15px").attr("alignment-baseline","middle");

g.append("circle").attr("cx",200 + legend_spacing_horizontal).attr("cy",legend_top_height).attr("r", 6).style("fill", '#5C84CC');
g.append("text").attr("x", 220 + legend_spacing_horizontal).attr("y", legend_top_height).text("The person in the middle seat gets both arm rests").style("font-size", "15px").attr("alignment-baseline","middle");

g.append("circle").attr("cx",200 + legend_spacing_horizontal).attr("cy",legend_top_height  + legend_spacing_vert).attr("r", 6).style("fill", '#A5A5A5');
g.append("text").attr("x", 220 + legend_spacing_horizontal).attr("y", legend_top_height + legend_spacing_vert).text("The arm rests should be shared").style("font-size", "15px").attr("alignment-baseline","middle");
}).catch(function(error){ //error handling for async function
    return error;
}); //end data load

