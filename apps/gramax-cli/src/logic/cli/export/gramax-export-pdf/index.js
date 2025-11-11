#!/usr/bin/env -S node --no-warnings
import http from "http";
import path from "path";
import fs from "fs";
import sirv from "sirv";
import { chromium } from "playwright";

async function startStaticServer(entryPath) {
	const root = path.resolve(entryPath);

	const serve = sirv(root, {
		dev: true,
		etag: true,
		single: true,
	});

	const server = http.createServer(serve);

	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const { port } = server.address();
	const baseURL = `http://127.0.0.1:${port}`;

	const close = () => new Promise((res, rej) => server.close((e) => (e ? rej(e) : res())));

	return { baseURL, close };
}

const print = async ({ source, output, params = {} }) => {
	if (!source) {
		throw new Error("Missing required parameters source");
	}
	const { baseURL, close } = await startStaticServer(source);
	const browser = await chromium.launch();

	const page = await browser.newPage();
	await page.goto(baseURL, { waitUntil: "load" });

	await page.waitForLoadState("networkidle").catch(() => {});
	await page.evaluate(() => window.document.fonts?.ready ?? Promise.resolve());
	await page.evaluate(() => window.gramaxPrintCatalog ?? Promise.resolve());

	await page.exposeFunction("reportStatus", (st) => {
		console.log(st);
	});
	const finalStatus = await page.evaluate(
		(paramsFromCli) =>
			new Promise((resolve, reject) => {
				const to = setTimeout(() => reject(new Error("timeout waiting status")), 13000000);

				window.gramaxPrintCatalog((st) => {
					window.reportStatus(st);
					if (st === "done") {
						clearTimeout(to);
						resolve(st);
					}
				}, paramsFromCli);
			}),
		params,
	);

	console.log("start-export");
	await page.pdf({
		path: output,
		format: "A4",
		printBackground: true,
		preferCSSPageSize: true,
	});
	console.log("done-export");

	await browser.close();
	await close();
};

const parseParams = (params) => {
	try {
		const decoded = Buffer.from(params, "base64").toString("utf8");
		return JSON.parse(decoded);
	} catch (e) {
		throw Error(`Error parsing params JSON: ${e.message}`);
	}
};
const run = () => {
	const [, , paramsArg] = process.argv;

	if (paramsArg === "ping") process.exit(0);

	const params = parseParams(paramsArg);

	print(params).catch((e) => {
		console.error(`Error: ${e.message}`);
		process.exit(1);
	});
};

run();
