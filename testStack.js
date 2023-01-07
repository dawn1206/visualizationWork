//svg背景
const width = 975
const height = width
//扇形内径外径
const innerRadius = 120
const outerRadius = Math.min(width, height) / 3
//图偏移量
const Xtrans = width/2;
const Ytrans = height/2; 

const svg = d3.select("#wrapper").append("svg")
    .style("width", width)
    .style("height", height)
    .style("font", "10px sans-serif")

var path = svg.append("g")
    .selectAll("g")
    .style("transform", `translate(${Xtrans}px, ${Ytrans}px)`)

var xaxisSVG = svg.append("g")
var yaxisSVG = svg.append("g")
var zaxisSVG = svg.append("g")

var elements = ["PM2.5(微克每立方米)", "PM10(微克每立方米)", "SO2(微克每立方米)", "NO2(微克每立方米)", "CO(毫克每立方米)","O3(微克每立方米)"]
const colors = ["#FC8C79", "#DC768F", "#AC6C99", "#776491", "#5F6189","#495879"]
//正常扇形
var arc = d3.arc()
//用于更新数据时的扇形
var arc1 = d3.arc()
//用于移出数据时的扇形
var arc2 = d3.arc()



function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}


async function dataPreprocess(year, province) {
    var elementMax = [0, 0, 0, 0, 0]
    const data = await d3.csv("./radicalStack.csv", (d, _, columns) => {

        //根据传参的年份和省份选择数据
        if (d.year == year && d.province == province) {
            return d;
        }
    })

    return data;
}

async function updateArc(year, province) {


    const data = await dataPreprocess(year, province);

    // console.log(data);

    var chartNum = 0;
    var removeTransition = d3.transition().duration(500)
    var updateTransition = removeTransition.transition().duration(500)

    d3.selectAll(".img")
        .transition(removeTransition)
        .attr("d", arc2)
        .style("opacity", "0")
        .remove()

    d3.selectAll(".arcGroup")
        .transition(removeTransition)
        .remove()

    path
        .data(d3.stack().keys(elements)(data))
        .join(function (enter) {
            return enter.append("g")
        })
        .attr("class", "arcGroup")
        .selectAll("path")
        .data(d => d)
        .join(function (enter) {
            return enter.append("path")
                .style("transform", `translate(${Xtrans}px, ${Xtrans}px)`)
                .attr("fill", (d, i) => {
                    d.chartNum = chartNum
                    return colors[i === 11 ? chartNum++ : chartNum]
                }
                )
                .transition(updateTransition)
                .attr("d", arc1)
                .transition()
                .duration(updateTransition)
                .attr("d", arc)
                .attr("class", "img")
        }
        ).on("mousemove", function (d) {
            d3.select(this).style("opacity", "0.4")
        })
        .on("mouseout", function (d) {
            d3.select(this).style("opacity", "1")
        })


    d3.selectAll("path")
        .append('title')
        .text(function (d) {
            return d.data.month + "月  " + d.data.province + "地区  " + elements[parseInt(d.chartNum)] + ":" + (parseFloat(d.data[elements[parseInt(d.chartNum)]])*100).toFixed(2) + "%";
        });
}

function drawAxisText(data) {

    var x = d3.scaleBand()
        .domain(data.map(d => {
            return d["month"]
        }))
        .range([0, 2 * Math.PI])
        .align(0)

    var y = d3.scaleRadial()
        .domain([0, 1.2])
        .range([innerRadius, outerRadius])


    var z = d3.scaleOrdinal()
        .domain(elements)
        .range(colors)

    var xAxis = g => g
        .attr("text-anchor", "middle")
        .style("transform", `translate(${Xtrans}px, ${Ytrans}px)`)
        .call(g => g.selectAll("g")
            .data(data)
            .join("g")
            .attr("transform", d => `
              rotate(${((x(d["month"]) + x.bandwidth() / 2) * 180 / Math.PI - 90)})
              translate(${innerRadius},0)
            `)
            .call(g => g.append("text")
                .attr("transform", d => ((x(d["month"]) + x.bandwidth() / 2) * 180 / Math.PI - 90) < 0
                    ? "translate(" + (325 - (outerRadius + 10) + 10) + ")rotate(" + Math.abs(((x(d["month"]) + x.bandwidth() / 2) * 180 / Math.PI - 90)) + ")"
                    : "translate(" + (325 - (outerRadius + 10) + 10) + ")rotate(-" + ((x(d["month"]) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")")
                .text(d => d["month"])
                .style("font-size",10))
            .call(g => g.attr("text-anchor", function (d) { return (x(d["month"]) + x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
                .attr("transform", function (d) { return "rotate(" + ((x(d["month"]) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")" + "translate(" + (outerRadius + 20) + ",0)"; })
            )
        )

    var yAxis = g => g
        .attr("text-anchor", "middle")
        .style("transform", `translate(${Xtrans}px, ${Ytrans}px)`)
        .call(g => g.append("text")
            .attr("y", d => -y(y.ticks(5).pop()))
            .attr("dy", "-1em")
            .text("month")
            .style("font-size",15))
        .call(g => g.selectAll("g")
            .data(y.ticks(5))
            .join(
                function (enter) {
                    return enter.append("g")
                })
            .attr("fill", "none")
            .call(g => g.append("circle")
                .attr("stroke", "#000")
                .attr("stroke-opacity", 0.3)
                .attr("r", y))
            .call(g => g.append("text")
                .attr("y", d => -y(d))
                .attr("dy", "0.35em")
                .attr("stroke", "#fff")
                .attr("stroke-width", 5)
                .text(y.tickFormat(5, "s"))
                .clone(true)
                .attr("fill", "#000")
                .attr("stroke", "none")
                ))

    var zAxis = g => g.append("g")
        .style("transform", `translate(${Xtrans}px, 0px)`)
        .selectAll("g")
        .data(elements)
        .join("g")
        .attr("transform", (d, i) => `translate(-50,${Ytrans + (i - (elements.length - 1) / 2) * 30})`)
        .call(g => g.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", z))
        .call(g => g.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", "0.35em")
            .text(d => d))
            .style("font-size",10)

    xaxisSVG
        .call(xAxis);

    yaxisSVG
        .call(yAxis);

    zaxisSVG
        .call(zAxis);

    zaxisSVG.append("text")
        .style("transform", `translate(${Xtrans}px, ${Ytrans*0.8}px)`)
        .attr("x", -25)
        .attr("y", 0)
        .text(data[0].province)
        .style("font-size", 15)

    arc.innerRadius(d => y(d[0]))
        .outerRadius(d => y(d[1]))
        .startAngle(d => x(d.data["month"]))
        .endAngle(d => x(d.data["month"]) + x.bandwidth())
        .padAngle(0.06)
        .padRadius(innerRadius)

    arc1.innerRadius(d => y(d[0]))
        .outerRadius(d => y(d[1]))
        .startAngle(d => x(d.data["month"]))
        .endAngle(d => x(d.data["month"]) + 0.15)
        .padAngle(0.06)
        .padRadius(innerRadius)

    arc2.innerRadius(d => y(d[0]))
        .outerRadius(d => y(d[1]))
        .startAngle(d => x(d.data["month"]) + 0.3)
        .endAngle(d => x(d.data["month"]) + x.bandwidth())
        .padAngle(0.06)
        .padRadius(innerRadius)
}

async function drawBars() {

    var year = "2013";
    var province = "海南省"

    async function initialSVG(year, province) {

        const data = await dataPreprocess(year, province);

        drawAxisText(data);

        var chartNum = 0;

        path
            .data(d3.stack().keys(elements)(data))
            .join(function (enter) {
                return enter.append("g")
            })
            .attr("class", "arcGroup")
            .selectAll("path")
            .data(d => d)
            .join(function (enter) {
                return enter.append("path")
                    .style("transform", `translate(${Xtrans}px, ${Ytrans}px)`)
                    .attr("fill", (d, i) => {
                        d.chartNum = chartNum
                        return colors[i === 11 ? chartNum++ : chartNum]
                    }
                    )
                    .style("opacity", "0")
                    .transition(500)
                    .style("opacity", "1")
                    .attr("d", arc1)
                    .transition()
                    .duration(500)
                    .attr("d", arc)
                    .attr("class", "img")
            }
            ).on("mousemove", function (d) {
                d3.select(this).style("opacity", "0.4")
            })
            .on("mouseout", function (d) {
                d3.select(this).style("opacity", "1")
            })

        d3.selectAll("path")
            .append('title')
            .text(function (d) {
                return d.data.month + "月  " + d.data.province + "地区  " + elements[parseInt(d.chartNum)] + ":" + (parseFloat(d.data[elements[parseInt(d.chartNum)]])*100).toFixed(2) + "%";
            });

    }
    initialSVG(year, province)

    // await sleep(3000).then(() => {
    //     let year = "2014";
    //     let province = "北京市"
    //     updateArc(year, province)
    // })

    // await sleep(3000).then(() => {
    //     let year = "2015";
    //     let province = "北京市"
    //     updateArc(year, province)
    // })

    // await sleep(3000).then(() => {
    //     let year = "2016";
    //     let province = "北京市"
    //     updateArc(year, province)
    // })
    // await sleep(3000).then(() => {
    //     let year = "2017";
    //     let province = "北京市"
    //     updateArc(year, province)
    // })

    // await sleep(3000).then(() => {
    //     let year = "2018";
    //     let province = "北京市"
    //     updateArc(year, province)
    // })

}
drawBars()

