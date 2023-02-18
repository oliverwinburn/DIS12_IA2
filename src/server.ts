import { Server } from "http";

// spooky route management
import { mapServerFiles, serverRoutes } from "./routes";

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

server.listen(PORT, HOST, () => {console.log(`Server started on http://${HOST}:${PORT}/`)})