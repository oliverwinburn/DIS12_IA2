import { Chart } from "chart.js";


/** @type {HTMLSpanElement} */
const intDisplay = document.getElementById("internal-display")
/** @type {HTMLSpanElement} */
const extDisplay = document.getElementById("external-display")

/** @type {HTMLDivElement} */
const intDisplayElement = document.getElementById("internal-element")
/** @type {HTMLDivElement} */
const extDisplayElement = document.getElementById("external-element")

/** @type {CanvasRenderingContext2D} */
const ctxTemp = document.getElementById("chartTemp").getContext("2d")

/** @type {CanvasRenderingContext2D} */
const ctxHumid = document.getElementById("chartHumid").getContext("2d")

/** @typedef {{x: number, y: number}} Data */
/** @typedef {Data[]} Dataset */

/** @type {Dataset} */ let tempDataset = []
/** @type {Dataset} */ let humDataset = []
/** @type {Dataset} */ let extTempDataset = []
/** @type {Dataset} */ let extHumDataset = []


const options = (text, suggestedMin, suggestedMax) => {
    return {
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                title: "Time",
                time: { unit: "millisecond", },
                ticks: { display: false },
                grid: { display: false, },
            },
            y: {
                type: "linear",
                position: "left",
                title: { text, display: true, font: { size: 16 }, },
                suggestedMax, suggestedMin,
            }
        },
        animation: false,
        elements: { point: { radius: 0 } }
    }
}


const chartTemp = new Chart(ctxTemp, {
    type: "line",
    data: {
        datasets: [
            { label: "Internal", data: tempDataset, tension: 0.3, },
            { label: "External", data: extTempDataset, tension: 0.3, }
        ],
    },
    options: options("Temperature (°C)", 20, 30)
})

const chartHumid = new Chart(ctxHumid, {
    type: "line",
    data: {
        datasets: [
            { label: "Internal", data: humDataset, tension: 0.3 },
            { label: "External", data: extHumDataset, tension: 0.3, }
        ]
    },
    options: options("Humidity (%)", 50, 100)
})

let latestTimestamp = 0
let initialTime
let currentTemp
let extCurTemp, extCurHum

/** 
 * @param {Dataset} dataset
 * @param {number} cutoff */
function spliceDataset(dataset, cutoff) {
    for (let i = 0; i < dataset.length; i++) {
        if (dataset[i].x < cutoff) {
            dataset.splice(i, 1)
        }
    }

}

async function insertData() {
    /** @type {{id: number, timestamp: number, temperature: number, humidity: number}[]} */
    const APIData = JSON.parse((await fetch(`/api/fetch?timestamp=${latestTimestamp}`).then(r => r.text())))

    if (APIData.outside) {
        extCurTemp = APIData.outside.temperature
        extCurHum = APIData.outside.humidity
    }

    const insideData = APIData.inside
    if (!insideData.length) return
    insideData.sort((a, b) => a.timestamp - b.timestamp)

    latestTimestamp = insideData.at(-1).timestamp
    if (!initialTime) initialTime = insideData.at(0).timestamp - 30000

    const tempData = insideData.map(d => { return { x: d.timestamp - initialTime, y: d.temperature } })
    const humidData = insideData.map(d => { return { x: d.timestamp - initialTime, y: d.humidity } })

    tempData.forEach(d => { tempDataset.push(d); extTempDataset.push({ x: d.x, y: extCurTemp }) })
    humidData.forEach(d => { humDataset.push(d); extHumDataset.push({ x: d.x, y: extCurHum }) })
    // console.log(extCurHum, extHumDataset)

    const maxTemp = tempData.at(-1)
    const cutoffTime = maxTemp.x - 35000

    spliceDataset(tempDataset, cutoffTime)
    spliceDataset(humDataset, cutoffTime)
    spliceDataset(extTempDataset, cutoffTime)
    spliceDataset(extHumDataset, cutoffTime)

    chartTemp.options.scales.x.min = cutoffTime
    chartHumid.options.scales.x.min = cutoffTime

    chartTemp.options.scales.x.max = maxTemp.x + 3000
    chartHumid.options.scales.x.max = maxTemp.x + 3000

    chartTemp.update()
    chartHumid.update()

    intDisplay.innerText = `${maxTemp.y.toFixed(1)}°C`
    extDisplay.innerText = `${extCurTemp}°C`
    currentTemp = maxTemp.y
    updateAlarm()
}

function updateAlarm() {
    try {
        if (currentTemp > insideThreshold) {
            intDisplayElement.classList.add("alarm")
        } else {
            intDisplayElement.classList.remove("alarm")
        }

        if (extCurTemp > outsideThreshold) {
            extDisplayElement.classList.add("alarm")
        } else {
            extDisplayElement.classList.remove("alarm")
        }

    } catch { }
}

const beginInserter = () => { insertData(); dataInserter = setInterval(insertData, 1000) }
const stopInserter = () => clearInterval(dataInserter)
beginInserter()
