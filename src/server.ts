import { Server } from "http";
import { mapServerFiles, serverRoutes } from "./routes";
import { beginSerialMonitor } from "./serialmonitor";
import chalk from "chalk";
import { sequelize } from "./database";
import { handleServer } from "./handler";

const PORT = 80;
const HOST = "127.0.0.1"

mapServerFiles()

const server = new Server(async (request, response) => {
    await handleServer(request, response).catch((e) => {
        console.log(`[${chalk.red("ERROR")}] Internal server error`)
        console.error(e)
        response.writeHead(500).end()
    })
    console.log(`[${chalk.gray("LOG")}] `
        + `${request.socket.remoteAddress} - [${new Date().toLocaleTimeString()}] `
        + `${response.statusCode >= 400 ? chalk.red(response.statusCode) : chalk.green(response.statusCode)}` 
        + ` ${chalk.blue(request.method, request.url)}`)
})

sequelize.sync({ force: process.argv.includes("--fsync") }).then((res) => {
    console.log(`[${chalk.green("LOAD")}] Database loaded`)

    // beginSerialMonitor()

    server.listen(PORT, HOST, () => {
        console.log(`[${chalk.green("LOAD")}] Server started on http://${HOST}:${PORT}/`)
    })
})

