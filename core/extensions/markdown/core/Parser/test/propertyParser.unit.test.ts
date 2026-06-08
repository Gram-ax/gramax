/** biome-ignore-all lint/suspicious/noExplicitAny: expected */
import {
	extractInlinePropertyTokens,
	parseProperty,
	processBlockProperties,
} from "@ext/markdown/core/render/logic/Markdoc/src/tokenizer/plugins/properties";

describe("PropertyTokenTransformer", () => {
	it("find properties from inline text", () => {
		const initialToken = {
			type: "inline",
			tag: "",
			attrs: null,
			map: [0, 1],
			nesting: 0,
			level: 1,
			children: [
				{
					type: "text",
					tag: "",
					attrs: null,
					map: null,
					nesting: 0,
					level: 0,
					children: null,
					content:
						"📖 Märchen über den ungeschickten Ilja{% #enum:2 %} {% #date:2025-01-01 %} {% #text:test %} {% #enum2:2,5,7 %} {% #enum text:abobus, amogus %}",
					markup: "",
					info: "",
					meta: null,
					block: false,
					hidden: false,
				},
			],
			content:
				"📖 Märchen über den ungeschickten Ilja{% #enum:2 %} {% #date:2025-01-01 %} {% #text:test %} {% #enum2:2,5,7 %} {% #enum text:abobus, amogus %}",
			markup: "",
			info: "",
			meta: null,
			block: true,
			hidden: false,
		};

		const resultToken = {
			type: "inline",
			tag: "",
			attrs: null,
			map: [0, 1],
			nesting: 0,
			level: 1,
			children: [
				{
					type: "text",
					tag: "",
					attrs: [
						[
							"property",
							[
								{ name: "enum", value: ["2"] },
								{ name: "date", value: ["2025-01-01"] },
								{ name: "text", value: ["test"] },
								{ name: "enum2", value: ["2", "5", "7"] },
								{ name: "enum text", value: ["abobus", "amogus"] },
							],
						],
					],
					map: null,
					nesting: 0,
					level: 0,
					children: null,
					content: "📖 Märchen über den ungeschickten Ilja",
					markup: "",
					info: "",
					meta: null,
					block: false,
					hidden: false,
				},
			],
			content: "📖 Märchen über den ungeschickten Ilja",
			markup: "",
			info: "",
			meta: null,
			block: true,
			hidden: false,
		};

		const result = parseProperty(initialToken);
		expect(result).toEqual(resultToken);
	});

	it("find properties in image token", () => {
		const initialToken = {
			type: "inline",
			tag: "",
			attrs: null,
			map: [2, 3],
			nesting: 0,
			level: 1,
			children: [
				{
					type: "image",
					tag: "img",
					attrs: [
						["src", "./new-article.png"],
						["alt", ""],
						["width", "140px"],
						["height", "57px"],
					],
					map: null,
					nesting: 0,
					level: 0,
					children: [],
					content: "",
					markup: "",
					info: "",
					meta: null,
					block: false,
					hidden: false,
				},
				{
					type: "text",
					tag: "",
					attrs: null,
					map: null,
					nesting: 0,
					level: 0,
					children: null,
					content: "",
					markup: "",
					info: "",
					meta: null,
					block: false,
					hidden: false,
				},
			],
			content: "![](./new-article.png){width=140px height=57px} {% #enum:2 %} {% #date:2025-01-01 %}",
			markup: "",
			info: "",
			meta: null,
			block: true,
			hidden: false,
		};

		const resultTokens = {
			type: "inline",
			tag: "",
			attrs: null,
			map: [2, 3],
			nesting: 0,
			level: 1,
			children: [
				{
					type: "image",
					tag: "img",
					attrs: [
						["src", "./new-article.png"],
						["alt", ""],
						["width", "140px"],
						["height", "57px"],
						[
							"property",
							[
								{ name: "enum", value: ["2"] },
								{ name: "date", value: ["2025-01-01"] },
							],
						],
					],
					map: null,
					nesting: 0,
					level: 0,
					children: [],
					content: "",
					markup: "",
					info: "",
					meta: null,
					block: false,
					hidden: false,
				},
				{
					type: "text",
					tag: "",
					attrs: [
						[
							"property",
							[
								{ name: "enum", value: ["2"] },
								{ name: "date", value: ["2025-01-01"] },
							],
						],
					],
					map: null,
					nesting: 0,
					level: 0,
					children: null,
					content: "",
					markup: "",
					info: "",
					meta: null,
					block: false,
					hidden: false,
				},
			],
			content: "![](./new-article.png){width=140px height=57px}",
			markup: "",
			info: "",
			meta: null,
			block: true,
			hidden: false,
		};

		const result = parseProperty(initialToken);
		expect(result).toEqual(resultTokens);
	});

	it("clear properties from Text", () => {
		const initialToken = {
			type: "inline",
			tag: "",
			attrs: null,
			map: [0, 1],
			nesting: 0,
			level: 1,
			children: [
				{
					type: "text",
					tag: "",
					attrs: null,
					map: null,
					nesting: 0,
					level: 0,
					children: null,
					content: "📖 Märchen über den ungeschickten Ilja{% #enum:2 %}",
					markup: "",
					info: "",
					meta: null,
					block: false,
					hidden: false,
				},
			],
			content: "📖 Märchen über den ungeschickten Ilja{% #enum:2 %}",
			markup: "",
			info: "",
			meta: null,
			block: true,
			hidden: false,
		};

		const resultToken = {
			type: "inline",
			tag: "",
			attrs: null,
			map: [0, 1],
			nesting: 0,
			level: 1,
			children: [
				{
					type: "text",
					tag: "",
					attrs: [["property", [{ name: "enum", value: ["2"] }]]],
					map: null,
					nesting: 0,
					level: 0,
					children: null,
					content: "📖 Märchen über den ungeschickten Ilja",
					markup: "",
					info: "",
					meta: null,
					block: false,
					hidden: false,
				},
			],
			content: "📖 Märchen über den ungeschickten Ilja",
			markup: "",
			info: "",
			meta: null,
			block: true,
			hidden: false,
		};

		const result = parseProperty(initialToken);
		expect(result).toEqual(resultToken);
	});
});

describe("extractInlinePropertyTokens", () => {
	it("extracts property tag from inline children to block level", () => {
		const tokens = [
			{ type: "tag_open", nesting: 1, meta: { tag: "tab" }, attrs: null },
			{ type: "paragraph_open", nesting: 1 },
			{
				type: "inline",
				nesting: 0,
				children: [
					{ type: "tag_close", nesting: -1, meta: { tag: "tab" }, content: "", block: false },
					{ type: "text", nesting: 0, content: " ", block: false },
					{
						type: "tag",
						nesting: 0,
						meta: {
							tag: "property",
							attributes: [
								{ type: "attribute", name: "id", value: "Reviewers" },
								{ type: "attribute", name: "value", value: "SY" },
							],
						},
						content: "",
						block: false,
					},
				],
				content: '</tab> <property id="Reviewers" value="SY"/>',
			},
			{ type: "paragraph_close", nesting: -1 },
		];

		extractInlinePropertyTokens(tokens);

		expect(tokens.find((t) => t.type === "tag" && t.meta?.tag === "property")).toBeTruthy();
		expect(tokens.find((t) => t.type === "tag_close" && t.meta?.tag === "tab")).toBeTruthy();
		expect(tokens.find((t) => t.type === "inline")).toBeFalsy();
		expect(tokens.find((t) => t.type === "paragraph_open")).toBeFalsy();
		expect(tokens.find((t) => t.type === "paragraph_close")).toBeFalsy();
	});

	it("keeps inline token when it has text content alongside property", () => {
		const tokens = [
			{ type: "paragraph_open", nesting: 1 },
			{
				type: "inline",
				nesting: 0,
				children: [
					{ type: "text", nesting: 0, content: "Some text", block: false },
					{
						type: "tag",
						nesting: 0,
						meta: {
							tag: "property",
							attributes: [
								{ type: "attribute", name: "id", value: "Status" },
								{ type: "attribute", name: "value", value: "Draft" },
							],
						},
						content: "",
						block: false,
					},
				],
				content: 'Some text <property id="Status" value="Draft"/>',
			},
			{ type: "paragraph_close", nesting: -1 },
		];

		extractInlinePropertyTokens(tokens);

		const inline = tokens.find((t) => t.type === "inline");
		expect(inline).toBeTruthy();
		expect(inline.children).toHaveLength(1);
		expect(inline.children[0].content).toBe("Some text");

		const property = tokens.find((t) => t.type === "tag" && (t as any).meta?.tag === "property");
		expect(property).toBeTruthy();
		expect((property as any).block).toBe(true);
	});

	it("does not touch inline tokens without property tags", () => {
		const tokens = [
			{ type: "paragraph_open", nesting: 1 },
			{
				type: "inline",
				nesting: 0,
				children: [{ type: "text", nesting: 0, content: "Normal text", block: false }],
				content: "Normal text",
			},
			{ type: "paragraph_close", nesting: -1 },
		];

		const before = JSON.stringify(tokens);
		extractInlinePropertyTokens(tokens);
		expect(JSON.stringify(tokens)).toBe(before);
	});

	it("does not touch inline tokens that only have tag_close (no property)", () => {
		const tokens = [
			{ type: "td_open", nesting: 1 },
			{
				type: "inline",
				nesting: 0,
				children: [{ type: "tag_close", nesting: -1, meta: { tag: "note" }, content: "", block: false }],
				content: "</note>",
			},
			{ type: "td_close", nesting: -1 },
		];

		const before = JSON.stringify(tokens);
		extractInlinePropertyTokens(tokens);
		expect(JSON.stringify(tokens)).toBe(before);
	});
});

describe("processBlockProperties", () => {
	it("attaches property to the preceding tag_open via tag_close", () => {
		const tokens = [
			{
				type: "tag_open",
				nesting: 1,
				meta: { tag: "tab", attributes: [{ name: "name", value: "Tab1" }] },
				attrs: null,
			},
			{ type: "paragraph_open", nesting: 1 },
			{ type: "inline", nesting: 0, children: [{ type: "text", content: "Content" }], content: "Content" },
			{ type: "paragraph_close", nesting: -1 },
			{ type: "tag_close", nesting: -1, meta: { tag: "tab" } },
			{
				type: "tag",
				nesting: 0,
				meta: {
					tag: "property",
					attributes: [
						{ type: "attribute", name: "id", value: "Reviewers" },
						{ type: "attribute", name: "value", value: "SY" },
					],
				},
			},
		];

		processBlockProperties(tokens);

		const tabOpen = tokens.find((t) => t.type === "tag_open" && t.meta?.tag === "tab");
		expect(tabOpen.attrs.property).toEqual([{ id: "Reviewers", value: ["SY"] }]);
		expect(tokens.find((t) => t.type === "tag" && t.meta?.tag === "property")).toBeFalsy();
	});

	it("attaches property to correct tag when nested", () => {
		const tokens = [
			{ type: "tag_open", nesting: 1, meta: { tag: "tabs" }, attrs: null },
			{ type: "tag_open", nesting: 1, meta: { tag: "tab", attributes: [] }, attrs: null },
			{ type: "paragraph_open", nesting: 1 },
			{ type: "inline", nesting: 0, children: [{ type: "text", content: "Inner" }], content: "Inner" },
			{ type: "paragraph_close", nesting: -1 },
			{ type: "tag_close", nesting: -1, meta: { tag: "tab" } },
			{
				type: "tag",
				nesting: 0,
				meta: {
					tag: "property",
					attributes: [
						{ type: "attribute", name: "id", value: "Country" },
						{ type: "attribute", name: "value", value: "Russia" },
					],
				},
			},
			{ type: "tag_close", nesting: -1, meta: { tag: "tabs" } },
		];

		processBlockProperties(tokens);

		const tabOpen = tokens.find((t) => t.type === "tag_open" && t.meta?.tag === "tab");
		expect(tabOpen.attrs.property).toEqual([{ id: "Country", value: ["Russia"] }]);

		const tabsOpen = tokens.find((t) => t.type === "tag_open" && t.meta?.tag === "tabs");
		expect(tabsOpen.attrs?.property).toBeUndefined();
	});

	it("extracts inline property and attaches it to correct tag", () => {
		const tokens = [
			{
				type: "tag_open",
				nesting: 1,
				meta: { tag: "tab", attributes: [{ name: "name", value: "На сайте" }] },
				attrs: null,
			},
			{ type: "paragraph_open", nesting: 1 },
			{ type: "inline", nesting: 0, children: [{ type: "text", content: "Content" }], content: "Content" },
			{ type: "paragraph_close", nesting: -1 },
			{ type: "paragraph_open", nesting: 1 },
			{
				type: "inline",
				nesting: 0,
				children: [
					{ type: "tag_close", nesting: -1, meta: { tag: "tab" }, content: "", block: false },
					{ type: "text", nesting: 0, content: " ", block: false },
					{
						type: "tag",
						nesting: 0,
						meta: {
							tag: "property",
							attributes: [
								{ type: "attribute", name: "id", value: "Reviewers" },
								{ type: "attribute", name: "value", value: "SY" },
							],
						},
						content: "",
						block: false,
					},
				],
				content: '</tab> <property id="Reviewers" value="SY"/>',
			},
			{ type: "paragraph_close", nesting: -1 },
		];

		processBlockProperties(tokens);

		const tabOpen = tokens.find((t) => t.type === "tag_open" && t.meta?.tag === "tab");
		expect(tabOpen.attrs.property).toEqual([{ id: "Reviewers", value: ["SY"] }]);
		expect(tokens.find((t) => t.type === "tag" && t.meta?.tag === "property")).toBeFalsy();
	});

	it("handles comma-separated values", () => {
		const tokens = [
			{ type: "tag_open", nesting: 1, meta: { tag: "tab" }, attrs: null },
			{ type: "tag_close", nesting: -1, meta: { tag: "tab" } },
			{
				type: "tag",
				nesting: 0,
				meta: {
					tag: "property",
					attributes: [
						{ type: "attribute", name: "id", value: "Tags" },
						{ type: "attribute", name: "value", value: "one, two, three" },
					],
				},
			},
		];

		processBlockProperties(tokens);

		const tabOpen = tokens.find((t) => t.type === "tag_open");
		expect(tabOpen.attrs.property).toEqual([{ id: "Tags", value: ["one", "two", "three"] }]);
	});
});
