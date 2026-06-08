/** biome-ignore-all lint/suspicious/noExplicitAny: expected */
import htmlTokensInHtmlPlugin from "@ext/markdown/core/render/logic/Markdoc/src/tokenizer/plugins/htmlTokensInHtml";
import MarkdownIt from "markdown-it";

const makeToken = (type: string, tag: string, nesting: number, extra?: Partial<any>): any => ({
	type,
	tag,
	attrs: null,
	map: null,
	nesting,
	level: 0,
	children: null,
	content: "",
	markup: "",
	info: "",
	meta: { tag },
	block: true,
	hidden: false,
	...extra,
});

const runPlugin = (tokens: any[]): any[] => {
	const md = new MarkdownIt();
	htmlTokensInHtmlPlugin(md);
	const state = { tokens } as any;
	(md.core.ruler as any).__rules__.find((r: any) => r.name === "html-tokens-in-html").fn(state);
	return tokens;
};

describe("htmlTokensInHtmlPlugin", () => {
	it("single tag_close html after fence — not removed, fence unchanged", () => {
		const tokens = [
			makeToken("fence", "code", 0, { content: "some code" }),
			makeToken("tag_close", "html", -1, { info: "/html" }),
		];

		runPlugin(tokens);

		expect(tokens).toHaveLength(2);
		expect(tokens[0].content).toBe("some code");
		expect(tokens[1].type).toBe("tag_close");
	});

	it("two tag_close html after fence — first appended to fence, last kept", () => {
		const tokens = [
			makeToken("fence", "code", 0, { content: "some code" }),
			makeToken("tag_close", "html", -1, { info: "/html" }),
			makeToken("tag_close", "html", -1, { info: "/html" }),
		];

		runPlugin(tokens);

		expect(tokens).toHaveLength(2);
		expect(tokens[0].content).toBe("some code\n</html>");
		expect(tokens[1].type).toBe("tag_close");
	});

	it("three tag_close html after fence — first two appended, last kept", () => {
		const tokens = [
			makeToken("fence", "code", 0, { content: "some code\n\n" }),
			makeToken("tag_close", "html", -1, { info: "/html" }),
			makeToken("tag_close", "html", -1, { info: "/html" }),
			makeToken("tag_close", "html", -1, { info: "/html" }),
		];

		runPlugin(tokens);

		expect(tokens).toHaveLength(2);
		expect(tokens[0].content).toBe("some code\n\n</html>\n</html>");
		expect(tokens[1].type).toBe("tag_close");
	});

	it("append through \\n\\n if content does not end with \\n\\n", () => {
		const tokens = [
			makeToken("fence", "code", 0, { content: "some code" }),
			makeToken("tag_close", "html", -1, { info: "/html" }),
			makeToken("tag_close", "html", -1, { info: "/html" }),
		];

		runPlugin(tokens);

		expect(tokens[0].content).toBe("some code\n</html>");
	});

	it("append without extra \\n\\n if content already ends with \\n\\n", () => {
		const tokens = [
			makeToken("fence", "code", 0, { content: "some code\n\n" }),
			makeToken("tag_close", "html", -1, { info: "/html" }),
			makeToken("tag_close", "html", -1, { info: "/html" }),
		];

		runPlugin(tokens);

		expect(tokens[0].content).toBe("some code\n\n</html>");
	});

	it("do not touch tag_close html if there is no fence before it", () => {
		const tokens = [makeToken("paragraph_open", "p", 1), makeToken("tag_close", "html", -1, { info: "/html" })];

		runPlugin(tokens);

		expect(tokens).toHaveLength(2);
	});

	it("do not touch tag_close html if fence and tag_close are separated by another token", () => {
		const tokens = [
			makeToken("fence", "code", 0, { content: "code" }),
			makeToken("paragraph_open", "p", 1),
			makeToken("tag_close", "html", -1, { info: "/html" }),
		];

		runPlugin(tokens);

		expect(tokens).toHaveLength(3);
	});

	it("do not touch tag_close of other tags after fence", () => {
		const tokens = [
			makeToken("fence", "code", 0, { content: "code" }),
			makeToken("tag_close", "note", -1, { info: "/note" }),
		];

		runPlugin(tokens);

		expect(tokens).toHaveLength(2);
		expect(tokens[1].type).toBe("tag_close");
	});

	it("reset fenceToken after non-fence non-tag_close token", () => {
		const tokens = [
			makeToken("fence", "code", 0, { content: "code" }),
			makeToken("inline", "", 0),
			makeToken("tag_close", "html", -1, { info: "/html" }),
			makeToken("tag_close", "html", -1, { info: "/html" }),
		];

		runPlugin(tokens);

		expect(tokens).toHaveLength(4);
		expect(tokens[0].content).toBe("code");
	});

	it("two html blocks in a row — each keeps its last tag_close", () => {
		const tokens = [
			{
				type: "tag_open",
				tag: "",
				attrs: null,
				map: [0, 1],
				nesting: 1,
				level: 0,
				children: null,
				content: "",
				markup: "",
				info: "html",
				meta: { tag: "html", attributes: null },
				block: true,
				hidden: false,
			},
			{
				type: "fence",
				tag: "code",
				attrs: null,
				map: [1, 8],
				nesting: 0,
				level: 1,
				children: null,
				content: "\n\n123\n\n\n",
				markup: "```",
				info: "",
				meta: null,
				block: true,
				hidden: false,
			},
			{
				type: "tag_close",
				tag: "",
				attrs: null,
				map: [8, 9],
				nesting: -1,
				level: 0,
				children: null,
				content: "",
				markup: "",
				info: "/html",
				meta: { tag: "html" },
				block: true,
				hidden: false,
			},
			{
				type: "tag_close",
				tag: "",
				attrs: null,
				map: [10, 11],
				nesting: -1,
				level: -1,
				children: null,
				content: "",
				markup: "",
				info: "/html",
				meta: { tag: "html" },
				block: true,
				hidden: false,
			},
			{
				type: "tag_close",
				tag: "",
				attrs: null,
				map: [12, 13],
				nesting: -1,
				level: -2,
				children: null,
				content: "",
				markup: "",
				info: "/html",
				meta: { tag: "html" },
				block: true,
				hidden: false,
			},
			{
				type: "tag_open",
				tag: "",
				attrs: null,
				map: [14, 15],
				nesting: 1,
				level: -2,
				children: null,
				content: "",
				markup: "",
				info: "html",
				meta: { tag: "html", attributes: null },
				block: true,
				hidden: false,
			},
			{
				type: "fence",
				tag: "code",
				attrs: null,
				map: [15, 22],
				nesting: 0,
				level: -1,
				children: null,
				content: "\n\n456\n\n\n",
				markup: "```",
				info: "",
				meta: null,
				block: true,
				hidden: false,
			},
			{
				type: "tag_close",
				tag: "",
				attrs: null,
				map: [22, 23],
				nesting: -1,
				level: -2,
				children: null,
				content: "",
				markup: "",
				info: "/html",
				meta: { tag: "html" },
				block: true,
				hidden: false,
			},
			{
				type: "tag_close",
				tag: "",
				attrs: null,
				map: [24, 25],
				nesting: -1,
				level: -3,
				children: null,
				content: "",
				markup: "",
				info: "/html",
				meta: { tag: "html" },
				block: true,
				hidden: false,
			},
			{
				type: "tag_close",
				tag: "",
				attrs: null,
				map: [26, 27],
				nesting: -1,
				level: -4,
				children: null,
				content: "",
				markup: "",
				info: "/html",
				meta: { tag: "html" },
				block: true,
				hidden: false,
			},
		];

		runPlugin(tokens);

		const fences = tokens.filter((t) => t.type === "fence");
		const closingTags = tokens.filter((t) => t.type === "tag_close");
		expect(fences).toHaveLength(2);
		expect(fences[0].content).toBe("\n\n123\n\n\n</html>\n</html>");
		expect(fences[1].content).toBe("\n\n456\n\n\n</html>\n</html>");
		expect(closingTags).toHaveLength(2);
	});

	it("recursively process child tokens", () => {
		const child1 = makeToken("fence", "code", 0, { content: "code" });
		const child2 = makeToken("tag_close", "html", -1, { info: "/html" });
		const child3 = makeToken("tag_close", "html", -1, { info: "/html" });
		const parent = makeToken("inline", "", 0, { children: [child1, child2, child3] });

		runPlugin([parent]);

		expect(parent.children).toHaveLength(2);
		expect(parent.children[0].content).toContain("</html>");
		expect(parent.children[1].type).toBe("tag_close");
	});

	it("do not change empty tokens array", () => {
		const tokens: any[] = [];
		runPlugin(tokens);
		expect(tokens).toHaveLength(0);
	});
});
