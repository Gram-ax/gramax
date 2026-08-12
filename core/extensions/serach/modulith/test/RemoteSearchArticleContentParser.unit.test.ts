import { initBackendModules } from "@app/resolveModule/backend";
import DiagramType from "@core/components/Diagram/DiagramType";
import RemoteSearchArticleContentParser from "@ext/serach/modulith/parsing/RemoteSearchArticleContentParser";
import { beforeAll, describe, expect, it } from "@jest/globals";
import type { JSONContent } from "@tiptap/core";
import { SemVer } from "semver";

beforeAll(async () => {
	await initBackendModules();
});

const getFragmentItems = (id: string) => {
	throw new Error(`getFragmentItems attempt, id: ${id}`);
};

const getPropertyValue = (id: string) => {
	throw new Error(`getPropertyValue attempt, id: ${id}`);
};

const parse = (
	items: JSONContent[],
	opts: { remoteVersion?: SemVer; readResource?: (src: string) => Promise<string | undefined> } = {},
) =>
	new RemoteSearchArticleContentParser({
		items,
		getFragmentItems,
		getPropertyValue,
		lang: "none",
		remoteVersion: opts.remoteVersion ?? new SemVer("0.0.7"),
		readResource: opts.readResource,
	}).parse();

describe("RemoteSearchArticleContentParser", () => {
	describe("plain text", () => {
		it("indexes paragraph text", async () => {
			const content: JSONContent[] = [{ type: "paragraph", content: [{ type: "text", text: "Hello world" }] }];
			expect(await parse(content)).toEqual([{ type: "text", text: "Hello world" }]);
		});

		it("indexes code block text", async () => {
			const content: JSONContent[] = [{ type: "code_block", content: [{ type: "text", text: "let x = 1;" }] }];
			expect(await parse(content)).toEqual([{ type: "text", text: "let x = 1;" }]);
		});

		it("indexes bullet list items", async () => {
			const content: JSONContent[] = [
				{
					type: "bulletList",
					content: [
						{
							type: "listItem",
							content: [{ type: "paragraph", content: [{ type: "text", text: "Item A" }] }],
						},
						{
							type: "listItem",
							content: [{ type: "paragraph", content: [{ type: "text", text: "Item B" }] }],
						},
					],
				},
			];
			expect(await parse(content)).toEqual([
				{ type: "text", text: "Item A" },
				{ type: "text", text: "Item B" },
			]);
		});
	});

	describe("headings", () => {
		it("heading creates a block that captures following text", async () => {
			const content: JSONContent[] = [
				{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Chapter" }] },
				{ type: "paragraph", content: [{ type: "text", text: "Body text" }] },
			];
			expect(await parse(content)).toEqual([
				{
					type: "block",
					title: "Chapter",
					items: [{ type: "text", text: "Body text" }],
				},
			]);
		});

		it("h2 inside h1 creates nested blocks", async () => {
			const content: JSONContent[] = [
				{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Section" }] },
				{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Subsection" }] },
				{ type: "paragraph", content: [{ type: "text", text: "Deep text" }] },
			];
			expect(await parse(content)).toEqual([
				{
					type: "block",
					title: "Section",
					items: [
						{
							type: "block",
							title: "Subsection",
							items: [{ type: "text", text: "Deep text" }],
						},
					],
				},
			]);
		});

		it("second h2 closes first h2 and becomes sibling inside h1", async () => {
			const content: JSONContent[] = [
				{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Chapter" }] },
				{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Part 1" }] },
				{ type: "paragraph", content: [{ type: "text", text: "Text 1" }] },
				{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Part 2" }] },
				{ type: "paragraph", content: [{ type: "text", text: "Text 2" }] },
			];
			expect(await parse(content)).toEqual([
				{
					type: "block",
					title: "Chapter",
					items: [
						{ type: "block", title: "Part 1", items: [{ type: "text", text: "Text 1" }] },
						{ type: "block", title: "Part 2", items: [{ type: "text", text: "Text 2" }] },
					],
				},
			]);
		});

		it("h1 after h2 exits both and creates a sibling h1", async () => {
			const content: JSONContent[] = [
				{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "First" }] },
				{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Sub" }] },
				{ type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Second" }] },
				{ type: "paragraph", content: [{ type: "text", text: "After" }] },
			];
			expect(await parse(content)).toEqual([
				{
					type: "block",
					title: "First",
					items: [{ type: "block", title: "Sub", items: [] }],
				},
				{
					type: "block",
					title: "Second",
					items: [{ type: "text", text: "After" }],
				},
			]);
		});
	});

	describe("note", () => {
		it("wraps note content in a titled block", async () => {
			const content: JSONContent[] = [
				{
					type: "note",
					attrs: { title: "Important" },
					content: [{ type: "paragraph", content: [{ type: "text", text: "Note body" }] }],
				},
			];
			expect(await parse(content)).toEqual([
				{
					type: "block",
					title: "Important",
					items: [{ type: "text", text: "Note body" }],
				},
			]);
		});

		it("note with headings inside nests heading blocks within the note scope", async () => {
			const content: JSONContent[] = [
				{
					type: "note",
					attrs: { title: "Tip" },
					content: [
						{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Sub" }] },
						{ type: "paragraph", content: [{ type: "text", text: "Sub text" }] },
					],
				},
			];
			expect(await parse(content)).toEqual([
				{
					type: "block",
					title: "Tip",
					items: [
						{
							type: "block",
							title: "Sub",
							items: [{ type: "text", text: "Sub text" }],
						},
					],
				},
			]);
		});
	});

	describe("tab", () => {
		it("wraps tab content in a block using attrs.name as title", async () => {
			const content: JSONContent[] = [
				{
					type: "tab",
					attrs: { name: "Overview" },
					content: [{ type: "paragraph", content: [{ type: "text", text: "Tab content" }] }],
				},
			];
			expect(await parse(content)).toEqual([
				{
					type: "block",
					title: "Overview",
					items: [{ type: "text", text: "Tab content" }],
				},
			]);
		});
	});

	describe("table", () => {
		it("indexes table cells as a table item preserving colspan and rowspan", async () => {
			const content: JSONContent[] = [
				{
					type: "table",
					content: [
						{
							type: "tableRow",
							content: [
								{
									type: "tableCell",
									attrs: { colspan: 1, rowspan: 1 },
									content: [{ type: "paragraph", content: [{ type: "text", text: "Cell A" }] }],
								},
								{
									type: "tableCell",
									attrs: { colspan: 2, rowspan: 1 },
									content: [{ type: "paragraph", content: [{ type: "text", text: "Cell B" }] }],
								},
							],
						},
						{
							type: "tableRow",
							content: [
								{
									type: "tableCell",
									attrs: { colspan: 1, rowspan: 2 },
									content: [],
								},
							],
						},
					],
				},
			];
			expect(await parse(content)).toEqual([
				{
					type: "table",
					rows: [
						{
							data: [
								{ items: [{ type: "text", text: "Cell A" }], colspan: 1, rowspan: 1 },
								{ items: [{ type: "text", text: "Cell B" }], colspan: 2, rowspan: 1 },
							],
						},
						{
							data: [{ items: [], colspan: 1, rowspan: 2 }],
						},
					],
				},
			]);
		});
	});

	describe("drawio", () => {
		it("is not indexed", async () => {
			const content: JSONContent[] = [{ type: "drawio", attrs: { content: "<mxGraphModel>...</mxGraphModel>" } }];
			expect(await parse(content)).toEqual([]);
		});
	});

	describe("diagrams", () => {
		it("skips diagram types other than mermaid and plant-uml", async () => {
			const content: JSONContent[] = [
				{
					type: "diagrams",
					attrs: { diagramName: "c4-scheme", content: "C4Context\nPerson(user, 'User')" },
				},
			];
			expect(await parse(content)).toEqual([]);
		});

		describe("mermaid", () => {
			it("v<0.0.7 stores title and definition as text items", async () => {
				const content: JSONContent[] = [
					{
						type: "diagrams",
						attrs: {
							diagramName: DiagramType.mermaid,
							content: "graph TD\nA --> B",
							title: "Flow",
						},
					},
				];
				expect(await parse(content, { remoteVersion: new SemVer("0.0.6") })).toEqual([
					{ type: "text", text: "Flow" },
					{ type: "text", text: "graph TD\nA --> B" },
				]);
			});

			it("v<0.0.7 with no title only stores definition", async () => {
				const content: JSONContent[] = [
					{
						type: "diagrams",
						attrs: { diagramName: DiagramType.mermaid, content: "graph TD\nA --> B" },
					},
				];
				expect(await parse(content, { remoteVersion: new SemVer("0.0.6") })).toEqual([
					{ type: "text", text: "graph TD\nA --> B" },
				]);
			});

			it("v>=0.0.7 stores as diagram item with raw definition", async () => {
				const content: JSONContent[] = [
					{
						type: "diagrams",
						attrs: { diagramName: DiagramType.mermaid, content: "graph TD\nA --> B", title: "Flow" },
					},
				];
				expect(await parse(content, { remoteVersion: new SemVer("0.0.7") })).toEqual([
					{
						type: "diagram",
						diagramType: DiagramType.mermaid,
						title: "Flow",
						items: [{ type: "text", text: "graph TD\nA --> B" }],
					},
				]);
			});

			it("v>=0.0.7 with empty definition is skipped", async () => {
				const content: JSONContent[] = [
					{
						type: "diagrams",
						attrs: { diagramName: DiagramType.mermaid, content: "", title: "Empty" },
					},
				];
				expect(await parse(content, { remoteVersion: new SemVer("0.0.7") })).toEqual([]);
			});

			it("v>=0.0.7 loads definition from src when content is absent", async () => {
				const readResource = async (src: string) =>
					src === "./chart.mermaid" ? 'pie title X\n"A" : 1' : undefined;
				const content: JSONContent[] = [
					{
						type: "diagrams",
						attrs: { diagramName: DiagramType.mermaid, src: "./chart.mermaid", title: "Pie" },
					},
				];
				expect(await parse(content, { remoteVersion: new SemVer("0.0.7"), readResource })).toEqual([
					{
						type: "diagram",
						diagramType: DiagramType.mermaid,
						title: "Pie",
						items: [{ type: "text", text: 'pie title X\n"A" : 1' }],
					},
				]);
			});

			it("v>=0.0.7 missing src file produces no item", async () => {
				const readResource = async (_src: string) => undefined;
				const content: JSONContent[] = [
					{
						type: "diagrams",
						attrs: { diagramName: DiagramType.mermaid, src: "./missing.mermaid", title: "Gone" },
					},
				];
				expect(await parse(content, { remoteVersion: new SemVer("0.0.7"), readResource })).toEqual([]);
			});
		});

		describe("plant-uml", () => {
			it("v<0.0.7 stores title and definition as text items", async () => {
				const content: JSONContent[] = [
					{
						type: "diagrams",
						attrs: {
							diagramName: DiagramType["plant-uml"],
							content: "@startuml\nAlice -> Bob\n@enduml",
							title: "Sequence",
						},
					},
				];
				expect(await parse(content, { remoteVersion: new SemVer("0.0.6") })).toEqual([
					{ type: "text", text: "Sequence" },
					{ type: "text", text: "@startuml\nAlice -> Bob\n@enduml" },
				]);
			});

			it("v>=0.0.7 stores as diagram item with raw definition", async () => {
				const content: JSONContent[] = [
					{
						type: "diagrams",
						attrs: {
							diagramName: DiagramType["plant-uml"],
							content: "@startuml\nAlice -> Bob\n@enduml",
							title: "Sequence",
						},
					},
				];
				expect(await parse(content, { remoteVersion: new SemVer("0.0.7") })).toEqual([
					{
						type: "diagram",
						diagramType: DiagramType["plant-uml"],
						title: "Sequence",
						items: [{ type: "text", text: "@startuml\nAlice -> Bob\n@enduml" }],
					},
				]);
			});
		});
	});

	describe("blockMd", () => {
		it("indexes Db-table as text items and a field table", async () => {
			const content: JSONContent[] = [
				{
					type: "blockMd",
					attrs: {
						text: "[db-table:Orders:./tables.yaml]",
						tag: [
							{
								name: "Db-table",
								attributes: {
									object: {
										code: "Orders",
										title: { default: "Orders Table" },
										description: { default: null },
										fields: [
											{
												code: "id",
												title: { default: "Order ID" },
												description: { default: "Primary key" },
												sqlType: "int",
											},
											{
												code: "amount",
												title: { default: "Amount" },
												description: { default: null },
												sqlType: "decimal",
											},
										],
									},
								},
							},
						],
					},
				},
			];
			expect(await parse(content)).toEqual([
				{ type: "text", text: "Orders" },
				{ type: "text", text: "Orders Table" },
				{
					type: "table",
					rows: [
						{
							data: [
								{ items: [{ type: "text", text: "Field" }] },
								{ items: [{ type: "text", text: "Type" }] },
								{ items: [{ type: "text", text: "Description" }] },
							],
						},
						{
							data: [
								{ items: [{ type: "text", text: "id" }] },
								{ items: [{ type: "text", text: "int" }] },
								{ items: [{ type: "text", text: "Order ID Primary key" }] },
							],
						},
						{
							data: [
								{ items: [{ type: "text", text: "amount" }] },
								{ items: [{ type: "text", text: "decimal" }] },
								{ items: [{ type: "text", text: "Amount " }] },
							],
						},
					],
				},
			]);
		});

		it("ignores unknown blockMd tag names", async () => {
			const content: JSONContent[] = [
				{
					type: "blockMd",
					attrs: {
						text: "[custom-tag:foo]",
						tag: [{ name: "Custom-tag", attributes: {} }],
					},
				},
			];
			expect(await parse(content)).toEqual([]);
		});
	});
});
