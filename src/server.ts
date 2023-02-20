import { Server } from "http";
import { mapServerFiles, serverRoutes } from "./routes";
import { beginSerialMonitor } from "./serialmonitor";
import chalk from "chalk";
import { Readings, sequelize } from "./database";

const PORT = 80;
const HOST = "127.0.0.1"

mapServerFiles()

const server = new Server(async (request, response) => {
    const resourceURL = request.url?.split("?").at(0) || "/"
    const file = serverRoutes.get(resourceURL)
    if (file) {
        response.setHeader("Content-Type", file.mimeType);
        response.writeHead(200);
        response.end(await file.read());
        return
    }
    return response.writeHead(404).end();
})

sequelize.sync({ force: process.argv.includes("--fsync") }).then((res) => {
    console.log(`[${chalk.green("LOAD")}] Database loaded`)

    // beginSerialMonitor()

    server.listen(PORT, HOST, () => {
        console.log(`[${chalk.green("LOAD")}] Server started on http://${HOST}:${PORT}/`)
    })
})

