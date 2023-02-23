import fs from 'fs';
import path from 'path';
import * as mime from "mime-types";
import nunjucks from "nunjucks";
import chalk from "chalk";

// const nunjucksObject = { pagename: "Website" }
nunjucks.configure({ autoescape: true, noCache: true })

function recursiveReadDir(dir: string): string[] {
    let files: string[] = [];
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const fileStat = fs.statSync(filePath);
        if (fileStat.isDirectory()) {
            recursiveReadDir(filePath).forEach(file => files.push(file));
        } else if (fileStat.isFile()) {
            files.push(filePath);
        }
    });
    return files
}

const URLify = (URL: string) => "/" + encodeURI(URL.replaceAll("\\", "/").replaceAll(" ", "_"));

class File {
    URL: string;
    mimeType: string = "text/plain";
    filePath: string;
    readFunction: Function | undefined;

    public constructor(URL: string, filepath: string, readFunction?: (file: string) => Promise<string> | string) {
        this.URL = URL;
        this.filePath = filepath;
        this.mimeType = mime.lookup(filepath) || "text/plain";
        this.readFunction = readFunction
        serverRoutes.set(URL, this)
    }

    public async read() {
        if (this.readFunction) return this.readFunction(this.filePath)
        if (this.filePath) return fs.promises.readFile(this.filePath);
        return "";
    }
}

export const serverRoutes: Map<String, File> = new Map()

export function mapServerFiles() {
    console.log(`[${chalk.green("LOAD")}] Loading files into server routes`)

    new File("/dist/scripts/chart.js", "./src/scripts/chart.js", async (file) => {
        const data = await fs.promises.readFile(file, "utf-8")
        return data.split("\n").slice(1).join("\n")
    })
    new File("/dist/scripts/index.js", "./src/scripts/index.js", 
        (f) => fs.promises.readFile(f, "utf-8"))
    // recursiveReadDir("src/scripts").forEach(file => {
    //     if (!file.endsWith('.js')) return
    //     const URL = URLify(file).replace('src', 'dist')

    //     new File(URL, file, (file) => fs.promises.readFile(file, "utf-8"))
    // });

    recursiveReadDir("static/").forEach(file => new File(URLify(file), file));
    recursiveReadDir("css/").forEach(file =>
        new File("/dist" + URLify(file), file, (file) => fs.promises.readFile(file, "utf-8"))
    )
    console.log(`[${chalk.green("LOAD")}] ${chalk.blue(serverRoutes.size)} files loaded into directory`)

}