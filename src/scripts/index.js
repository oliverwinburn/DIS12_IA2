// Thanks stackoverflow for the regex
let insideThreshold = (document.cookie.match('inside=([^;].+?)(;|$)') || [])[1] || "25"
let outsideThreshold = (document.cookie.match('outside=([^;].+?)(;|$)') || [])[1] || "25"


const configButton = document.getElementById("configTitle")
const configOptions = document.getElementById("options")

configButton.onclick = () => {
    if (configOptions.classList.contains("closed")) {
        configOptions.classList.remove("closed")
    } else configOptions.classList.add("closed")
}

const insideSlider = document.getElementById("insideSlider")
const inReading = document.getElementById("inReading")
const outsideSlider = document.getElementById("outsideSlider")
const outReading = document.getElementById("outReading")

insideSlider.value = insideThreshold
outsideSlider.value = outsideThreshold
inReading.innerText = `(${insideThreshold}°C)`
outReading.innerText = `(${outsideThreshold}°C)`


insideSlider.oninput = () => {
    inReading.innerText = `(${insideSlider.value}°C)`
    insideThreshold = insideSlider.value
    document.cookie = `inside=${insideSlider.value}`
    updateAlarm()
}
outsideSlider.oninput = () => {
    outReading.innerText = `(${outsideSlider.value}°C)`
    outsideThreshold = outsideSlider.value
    document.cookie = `outside=${outsideSlider.value}`
    updateAlarm()
}