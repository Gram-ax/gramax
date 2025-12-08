import { CLASS_COLOR_MAP } from "./highlightToRuns";
import fs from "fs";
import path from "path";

const CSS_PATH = path.join(process.cwd(), "core", "styles", "code-block.css");

const parseLightThemeColors = () => {
	const css = fs.readFileSync(CSS_PATH, "utf-8");
	const lightPart = css.split("@media not print")[0] || css;
	const result: Record<string, string> = {};

	const blocks = lightPart.split("}");
	for (const raw of blocks) {
		const [selectorPart, body] = raw.split("{");
		if (!body || !selectorPart) continue;
		if (!body.includes("color:")) continue;

		const colorMatch = /color:\s*(#[0-9a-fA-F]{6})/i.exec(body);
		if (!colorMatch) continue;
		const color = colorMatch[1].replace("#", "").toLowerCase();

		const selectors = selectorPart
			.split(",")
			.map((s) => s.replace(/\[data-theme\]\s*/g, "").trim())
			.filter((s) => s.includes(".hljs-"));

		for (const sel of selectors) {
			const cls = sel.replace(/.*\.hljs-/, "hljs-").replace(/^\./, "");
			result[cls] = color;
		}
	}

	return result;
};

describe("highlight colors sync with light theme CSS", () => {
	it("parses light theme CSS into color map", () => {
		const cssColors = parseLightThemeColors();
		expect(cssColors["hljs-comment"]).toBe("656e77");
		expect(cssColors["hljs-keyword"]).toBe("015692");
		expect(cssColors["hljs-name"]).toBe("b75501");
		expect(cssColors["hljs-string"]).toBe("54790d");
	});

	it("matches CSS colors for light theme", () => {
		const cssColors = parseLightThemeColors();
		const missingInCss: string[] = [];
		const missingInMap: string[] = [];

		for (const [cls, color] of Object.entries(CLASS_COLOR_MAP)) {
			if (!cssColors[cls]) missingInCss.push(cls);
			else expect(cssColors[cls]).toBe(color.toLowerCase());
		}

		for (const cls of Object.keys(cssColors)) {
			if (cls === "hljs") continue;
			if (!CLASS_COLOR_MAP[cls]) missingInMap.push(cls);
		}

		if (missingInCss.length || missingInMap.length) {
			console.log("Missing in CSS:", missingInCss);
			console.log("Missing in CLASS_COLOR_MAP:", missingInMap);
		}

		expect(missingInCss.length).toBe(0);
		expect(missingInMap.length).toBe(0);
	});
});
