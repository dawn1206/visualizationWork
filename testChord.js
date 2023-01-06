const width = 954
const height = width
const innerRadius = Math.min(width, height) * 0.5 - 90
const outerRadius = innerRadius + 10
const Xtrans = width/2
const Ytrans = Xtrans

const names = ["PM2.5", "PM10", "SO2", "NO2", "CO", "O3", 'AQI', 'PSFC', 'RH', 'TEMP', 'WindPower']

const chord = d3.chordDirected()
    .padAngle(10 / innerRadius)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending)

const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)

    const ribbon = d3.ribbon()
    .radius(innerRadius - 1)
    .padAngle(5 / innerRadius)
//background-image: linear-gradient(to right, #051937, #004d7a, #008793, #00bf72, #a8eb12);
const color = d3.scaleOrdinal(names, ["#FC8C79", "#DC768F", "#AC6C99", "#776491", "#5F6189", "#495879", "#006487", "#008190", "#5D9D8B", "#84D87D", "#FFE171"])

const svg = d3.select("#wrapper").append("svg")
    .style("width", width)
    .style("height", height)
    .style("font", "10px sans-serif")

async function dataPreprocess(year) {

    const data = await d3.json("./chord.json")
    return data[year];
}

async function drawChord(year) {
    const oridata = await dataPreprocess(year);
    const data = Array.from(oridata)

    d3.selectAll(".chordGroup").remove()
    // const names = Array.from(new Set(data.flatMap(d => [d.source, d.target]))).sort(d3.ascending)

    const index = new Map(names.map((name, i) => [name, i]));
    const matrix = Array.from(index, () => new Array(names.length).fill(0));

    for (const { source, target, value } of data) matrix[index.get(source)][index.get(target)] += value;

    const chords = chord(matrix);

    const group = svg.append("g")
        .style("transform", `translate(${Xtrans}px, ${Ytrans}px)`)
        .attr("font-size", 10)
        .attr("font-family", "sans-serif")
        .attr("class", "chordGroup")
        .selectAll("g")
        .data(chords.groups)
        .join("g");

    group.append("path")
        .attr("fill", d => color(names[d.index]))
        .attr("d", arc);

    group.append("text")
        .each(d => (d.angle = (d.startAngle + d.endAngle) / 2))
        .attr("dy", "0.35em")
        .style("font-size", 20)
        .attr("transform", d => `
  rotate(${(d.angle * 180 / Math.PI - 90)})
  translate(${outerRadius + 5})
  ${d.angle > Math.PI ? "rotate(180)" : ""}
`)
        .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
        .text(d => names[d.index]);

    group.append("title")
        .text(d => `${names[d.index]}
${d3.sum(chords, c => (c.source.index === d.index) * c.source.value)} outgoing -
${d3.sum(chords, c => (c.target.index === d.index) * c.source.value)} incoming - `);

    svg.append("g")
        .attr("fill-opacity", 0.8)
        .selectAll("path")
        .data(chords)
        .join(function (enter) {
            return enter.append("path")
                .style("transform", `translate(${Xtrans}px, ${Ytrans}px)`)
                .style("mix-blend-mode", "multiply")
                .attr("fill", d => color(names[d.target.index]))
                .attr("d", ribbon)
                .append("title")
                .text(d => `${names[d.source.index]} → ${names[d.target.index]} ${d.source.value}`);
        })
}
drawChord("2014")