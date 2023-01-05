width = 1200
height = width

chartHeight = 400
chartWidth = 300

marginTop = 100 // top margin, in pixels
marginRight = 0 // right margin, in pixels
marginBottom = 30 // bottom margin, in pixels
marginLeft = 40 // left margin, in pixels

const svg = d3.select("#wrapper").append("svg")
    .style("width", width)
    .style("height", height)
    .style("font", "10px sans-serif")

var path = svg.append("g")
    .selectAll("g")
    .style("transform", `translate(${chartWidth + marginLeft}, ${chartHeight + marginTop})`)

var elements1 = ["PM2.5(微克每立方米)", "PM10(微克每立方米)"]
var elements2 = ["SO2(微克每立方米)", "NO2(微克每立方米)"]
var elements3 = ["CO(毫克每立方米)", "O3(微克每立方米)"]

var elementOrder = [elements1, elements2, elements3]
var colors = ["#c0392b", "#d35400", "#f39c12", "#f1c40f", "#2980b9", "#16a085"]
xaxisSVG = svg.append("g")
yaxisSVG = svg.append("g")

async function dataPreprocess(province) {
    const data = await d3.csv("./barChart.csv", (d, _, columns) => {

        //根据传参的年份和省份选择数据
        if (d.province == province) {
            return d;
        }
    })
    return data;
}
async function draw() {

    var order = 0;

    const data = await dataPreprocess("河南省");
    console.log(data)
    var x = d3.scaleBand()
        .domain(data.map(d => {
            return d.time
        }))
        .range([0, chartWidth*2.5])
        .align(0)
    // console.log(x.domain())
    var xAxis = g => g
        .attr("transform", `translate(${chartWidth + marginLeft}, ${chartHeight + marginTop})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .call(g => g.append("text")
            .attr("x", chartWidth + 10)
            .attr("y", 15)
            .attr("stroke", "#fff")
            .attr("stroke-width", 5)
            .text("年份")
            .clone(true)
            .attr("fill", "#000")
            .attr("stroke", "none"))

    svg.append("g")
        .attr("class", "x-axis")
        .call(xAxis);

    var yaxisSVG = svg.append("g")
        .attr("class", "y-axis")

    const button = svg
        .append("g")

    button
        .append("rect")
        .attr("x", chartWidth * 0.65)
        .attr("y", chartHeight * 0.54)
        .attr("rx", 14)
        .attr("width", 90)
        .attr("height", 45)
        .style("fill", "none")
        .style("stroke", "black")

    button
        .append("rect")
        .attr("x", chartWidth * 0.7)
        .attr("y", chartHeight * 0.56)
        .attr("rx", 10)
        .attr("width", 75)
        .attr("height", 30)
        .style("fill", "white")

    button.append("text")
        .attr("x", chartWidth * 0.71)
        .attr("y", chartHeight * 0.61)
        .attr("width", 45)
        .attr("height", 45)
        .attr("fill", "black")
        .text("切换数据组")

    button.node().addEventListener("click", onClick)
    function onClick() {
        order = order + 1
        drawBar(order)
    }

    function drawBar(order) {
        const removeTransition = d3.transition().duration(300)
        const updateTransition = removeTransition.transition().duration(300)

        if (order % 3 == 0) {
            initialCol = 0;

        } else if (order % 3 == 1) {
            initialCol = 2;
        }
        else {
            initialCol = 4;
        }

        var totalMax = 0;

        order %= 3;

        var elements = elementOrder[order]
        var elementColor = colors.slice(initialCol, elements.length + initialCol)

        for (let i = 0; i < data.length; i++) {
            var total = 0;
            for (j in elements) {
                total += data[i][elements[j]] = +data[i][elements[j]]
            }
            totalMax = Math.max(total, totalMax)
            data[i].id = i;
        }

        var y = d3.scaleLinear()
            .domain([0, totalMax])
            .range([chartHeight, 0])

        var yAxis = g => g
            .attr("transform", `translate(${chartWidth + marginLeft}, ${marginTop})`)
            .transition(updateTransition)
            .call(d3.axisLeft(y).ticks(chartHeight / 60))

        yaxisSVG
            .call(yAxis)
            .call(g => g.append("text")
                .attr("y", -10)
                .attr("stroke", "#fff")
                .attr("stroke-width", 5)
                .text("微克/立方米")
                .clone(true)
                .attr("fill", "#000")
                .attr("stroke", "none"))

        const dataSeries = d3.stack().keys(elements)(data)


        console.log(elements)

        d3.selectAll(".barchart")
            .transition(removeTransition)
            .attr("height", 0)
            .attr("y", 500)
            .remove()

        d3.selectAll(".barGroups")
            .transition(removeTransition)
            .remove()

        var chartNum = 0;
        const bar = svg.append("g")
            .selectAll("g")
            .data(dataSeries)
            .join("g")
            .attr("class", "barGroups")
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("class", "barchart")
            .attr("fill", (d, i) => {
                d.chartNum = chartNum
                return elementColor[i === 11 ? chartNum++ : chartNum]
            })
            .attr("transform", `translate(${chartWidth + marginLeft},0)`)
            .on("mousemove", function (d, i) {
                d3.select(this).style("opacity", "0.4")
            })
            .on("mouseout", function (d) {
                d3.select(this).style("opacity", "1")
            })
            .attr("x", (d) => x(d.data["time"]) + 0.5)
            .attr("width", x.bandwidth() - 0.75)
            .attr("height", 0)
            .attr("y", marginTop + chartHeight)
            .transition(updateTransition)
            .attr("y", (d) => {
                console.log(d)
                return marginTop + Math.min(y(d[0]), y(d[1]) - 0.5)
            }).attr("height", (d) => y(d[0]) - y(d[1]))

        d3.selectAll(".barchart")
            .append('title')
            .text(function (d) {
                return d.data.time + "  " + d.data.province + "地区  " + elements[parseInt(d.chartNum)] + ":" + d.data[elements[parseInt(d.chartNum)]];
            });
    }
    drawBar(0)
}
draw()