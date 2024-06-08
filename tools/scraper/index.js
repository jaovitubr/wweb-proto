import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import puppeteer from "puppeteer";

import { calculateProtosMd5 } from "./utils/protoMd5.js";

const __filename = url.fileURLToPath(new URL(import.meta.url));
const __dirname = path.dirname(__filename);

const IS_DEBUG = process.env.NODE_ENV === "development";
const OUT_DIR = process.env.OUT_DIR || "./out/proto";

if (!OUT_DIR) throw new Error("missing OUT_DIR");

const browser = await puppeteer.launch({
    headless: !IS_DEBUG,
    devtools: IS_DEBUG,
});

const [page] = await browser.pages();
console.log((await browser.userAgent()))

await page.setUserAgent(
    (await browser.userAgent())
        .replace("HeadlessChrome", "Chrome")
);

await page.goto("https://web.whatsapp.com/");

const [
    moduleRaidScript,
    scrapScript,
] = await Promise.all([
    fs.readFile(path.join(__dirname, "./utils/moduleRaid.js"), "utf8"),
    fs.readFile(path.join(__dirname, "./utils/protoScraper.js"), "utf8"),
]);

await page.evaluate(moduleRaidScript);
const protos = await page.evaluate(new Function("scrap", scrapScript));
const WWEB_VERSION = await page.evaluate(() => window.Debug.VERSION);

if (!IS_DEBUG) await browser.close();

const protosMd5 = calculateProtosMd5(protos);

const protosMd5FilePath = path.join(OUT_DIR, ".md5");
const wwebVersionFilePath = path.join(OUT_DIR, ".version");

await fs.rm(OUT_DIR, { recursive: true })
    .then(() => fs.mkdir(OUT_DIR))
    .catch(() => fs.mkdir(OUT_DIR));

await fs.writeFile(protosMd5FilePath, protosMd5);
await fs.writeFile(wwebVersionFilePath, WWEB_VERSION);

await Promise.all(
    Object.entries(protos).map(([protoName, proto]) => {
        const filePath = path.join(OUT_DIR, `${protoName}.proto`);

        return fs.writeFile(filePath, proto);
    })
);