import chalk from "chalk";
import { SerialPort, ReadlineParser } from "serialport";
import { Readings } from "./database";

export async function beginSerialMonitor() {
    console.log(`[${chalk.green("LOAD")}] Loading serial monitor`)
    const SERIALPORT = process.argv.find(val => val.startsWith("--COM:"))?.replace("--COM:", "") || "COM3"

    const port = new SerialPort({
        baudRate: 9600,
        path: SERIALPORT,
    })

    const parser = new ReadlineParser({ delimiter: "\r\n" })
    port.pipe(parser)

    parser.on("data", async (data: string) => {
        try {
            const parsed: {temperature: number, humidity: number} = JSON.parse(data)
            console.log(parsed, parsed.temperature, parsed.humidity)
            await Readings.insert(parsed.temperature, parsed.humidity).catch(e => console.log("db log failed"))
        } catch (e) {
            console.log("Data collection failed");
            console.error(e)
        }
    })
}