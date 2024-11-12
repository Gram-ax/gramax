/* global process */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import compileTimeEnv from "./compileTimeEnv.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const distPath = path.join(__dirname, "dist");

const setHeaders = (res) => {
	res.setHeader("cross-origin-opener-policy", "same-origin");
	res.setHeader("cross-origin-embedder-policy", "require-corp");
};

const envJs = `window.getEnv = (name) => {
	return {
${Object.entries(compileTimeEnv.getBuiltInVariables())
	.map(([key, value]) => `		${key}: ${typeof value === "string" ? `"${value}"` : value}`)
	.join(",\n")}
	}[name];
};
`;

app.use(express.static(distPath, { setHeaders }));
app.get("/env.js", (req, res) => {
	setHeaders(res);
	res.setHeader("content-type", "application/javascript");
	res.send(envJs);
});
app.get("*", (req, res) => {
	setHeaders(res);
	res.setHeader("content-type", "text/html");
	res.sendFile(path.join(distPath, "index.html"));
});
app.listen(PORT, () => {
	console.log(`express started at: http://localhost:${PORT}`);
});
