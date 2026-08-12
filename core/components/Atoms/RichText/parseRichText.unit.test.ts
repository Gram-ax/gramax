import { parseRichText, stripMarkup } from "./parseRichText";

const t = (text: string) => ({ type: "text" as const, text });
const c = (text: string) => ({ type: "code" as const, text });

describe("parseRichText", () => {
	test("splits paragraphs into segment lists", () => {
		expect(parseRichText("<p>first</p><p>second</p>")).toEqual([[t("first")], [t("second")]]);
	});

	test("treats text without paragraph markup as one paragraph", () => {
		expect(parseRichText("plain text")).toEqual([[t("plain text")]]);
	});

	test("interleaves text and code segments within a paragraph", () => {
		expect(
			parseRichText("<p>Changes from the <code>develop</code> branch will be merged into <code>main</code>.</p>"),
		).toEqual([[t("Changes from the "), c("develop"), t(" branch will be merged into "), c("main"), t(".")]]);
	});

	test("treats leading text before the first paragraph as its own paragraph", () => {
		expect(
			parseRichText("No connection to the server <code>https://ges.local</code>.<p>Check your network.</p>"),
		).toEqual([[t("No connection to the server "), c("https://ges.local"), t(".")], [t("Check your network.")]]);
	});

	test("parses code without surrounding paragraph markup", () => {
		expect(parseRichText("run <code>git push</code> to publish")).toEqual([
			[t("run "), c("git push"), t(" to publish")],
		]);
	});

	test("drops empty text segments when paragraph is only code", () => {
		expect(parseRichText("<p><code>only code</code></p>")).toEqual([[c("only code")]]);
	});

	test("drops empty code tags produced by empty placeholder values", () => {
		expect(parseRichText("<p>branch <code></code> is gone</p>")).toEqual([[t("branch "), t(" is gone")]]);
	});

	test("drops whitespace-only paragraphs and inter-paragraph whitespace", () => {
		expect(parseRichText("<p>a</p>\n<p> </p>\n<p>b</p>")).toEqual([[t("a")], [t("b")]]);
	});

	test("returns no paragraphs for empty string", () => {
		expect(parseRichText("")).toEqual([]);
	});
});

describe("stripMarkup", () => {
	test("flattens paragraphs and code into one plain sentence", () => {
		expect(
			stripMarkup(
				"Could not logout. No connection to the server <code>https://ges.local</code>.<p>Check your network connection and try again.</p>",
			),
		).toEqual(
			"Could not logout. No connection to the server https://ges.local. Check your network connection and try again.",
		);
	});

	test("returns plain text unchanged", () => {
		expect(stripMarkup("no markup here")).toEqual("no markup here");
	});

	test("trims surrounding whitespace", () => {
		expect(stripMarkup("  <p> padded </p>  ")).toEqual("padded");
	});

	test("returns empty string for empty input", () => {
		expect(stripMarkup("")).toEqual("");
	});
});
