import { initBackendModules } from "@app/resolveModule/backend";
import DiagramType from "@core/components/Diagram/DiagramType";
import type Path from "@core/FileProvider/Path/Path";
import * as extractTextsMermaidModule from "@ext/serach/modulith/parsing/extractTextsMermaid";
import * as plantUmlToSvgModule from "@ext/serach/modulith/parsing/plantUmlToSvg";
import RemoteSearchArticleContentParser from "@ext/serach/modulith/parsing/RemoteSearchArticleContentParser";
import SearchArticleContentParser from "@ext/serach/modulith/parsing/SearchArticleContentParser";
import type { SearchArticleItems } from "@ext/serach/modulith/SearchArticle";
import { afterEach, beforeAll, describe, expect, it, jest } from "@jest/globals";
import type { JSONContent } from "@tiptap/core";
import { SemVer } from "semver";
import testModel1 from "./testModel1.json";
import testModel1Expected from "./testModel1Expected.json";
import testModel2 from "./testModel2.json";
import testModel2Expected from "./testModel2Expected.json";
import testModel3 from "./testModel3.json";
import testModel3Expected from "./testModel3Expected.json";

type HierarchicalText = { type: "text"; text: string };
type HierarchicalBlock = {
	type: "block";
	title: string;
	metadata?: Record<string, unknown>;
	items: HierarchicalItem[];
};
type HierarchicalItem = HierarchicalText | HierarchicalBlock;

const toHierarchical = (result: SearchArticleItems): HierarchicalItem[] => {
	const byParent = new Map<string, (typeof result.entries)[number][]>();
	for (const entry of result.entries) {
		if (entry.parentId === undefined) continue;
		const list = byParent.get(entry.parentId);
		if (list) list.push(entry);
		else byParent.set(entry.parentId, [entry]);
	}

	const buildItems = (parentId: string): HierarchicalItem[] =>
		(byParent.get(parentId) ?? []).map((entry) => {
			if (!entry.isTitle) return { type: "text", text: entry.text };
			const block: HierarchicalBlock = { type: "block", title: entry.text, items: buildItems(entry.id) };
			if (entry.metadata !== undefined) block.metadata = entry.metadata as Record<string, unknown>;
			return block;
		});

	return buildItems(result.rootId);
};

beforeAll(async () => {
	await initBackendModules();
});

const getFragmentItems = (id: string) => {
	throw new Error(`getFragmentItems attempt, id: ${id}`);
};

const getPropertyValue = (id: string) => {
	throw new Error(`getPropertyValue attempt, id: ${id}`);
};

const getLinkId = (path: Path) => {
	throw new Error(`getLinkId attempt, id: ${path.toString()}`);
};

afterEach(() => {
	jest.restoreAllMocks();
});

describe("SearchArticleContentParser", () => {
	it("test testModel1", async () => {
		const actual = await new SearchArticleContentParser({
			items: testModel1.content,
			getFragmentItems,
			getPropertyValue,
			getLinkId,
			lang: "none",
			articleId: "test-1",
			title: "",
		}).parse();
		expect(toHierarchical(actual)).toEqual(testModel1Expected);
	});

	it("test testModel2", async () => {
		const actual = await new SearchArticleContentParser({
			items: testModel2.content,
			getFragmentItems,
			getPropertyValue,
			getLinkId,
			lang: "none",
			articleId: "test-2",
			title: "",
		}).parse();
		expect(toHierarchical(actual)).toEqual(testModel2Expected);
	});

	it("test testModel3", async () => {
		const actual = await new SearchArticleContentParser({
			items: testModel3.content,
			getFragmentItems,
			getPropertyValue,
			getLinkId,
			lang: "none",
			articleId: "test-3",
			title: "",
		}).parse();
		expect(toHierarchical(actual)).toEqual(testModel3Expected);
	});

	it("indexes mermaid as diagram item", async () => {
		jest.spyOn(extractTextsMermaidModule, "extractTextsMermaid").mockResolvedValue(["Search", "Done"]);
		const content: JSONContent[] = [
			{
				type: "diagrams",
				attrs: {
					diagramName: DiagramType.mermaid,
					content: "graph TD\n  A[Search] --> B[Done]",
					title: "Flow",
				},
			},
		];
		const actual = await new SearchArticleContentParser({
			items: content,
			getFragmentItems,
			getPropertyValue,
			getLinkId,
			lang: "none",
			articleId: "test-mermaid",
			title: "",
		}).parse();
		expect(toHierarchical(actual)).toEqual([
			{
				type: "block",
				title: "Flow",
				metadata: { type: "diagram", diagramType: DiagramType.mermaid },
				items: [
					{ type: "text", text: "Search" },
					{ type: "text", text: "Done" },
				],
			},
		]);
	});

	it("loads mermaid definition from attrs.src via getDiagramFileText when content absent", async () => {
		const loadSpy = jest.spyOn(extractTextsMermaidModule, "extractTextsMermaid").mockResolvedValue(["Pie", "A"]);
		const readResource = jest.fn(async (src: string) =>
			src === "./chart.mermaid" ? 'pie title Items\n"A" : 3' : undefined,
		);
		const content: JSONContent[] = [
			{
				type: "diagrams",
				attrs: {
					diagramName: DiagramType.mermaid,
					src: "./chart.mermaid",
					title: "Fig",
				},
			},
		];
		const actual = await new SearchArticleContentParser({
			items: content,
			getFragmentItems,
			getPropertyValue,
			getLinkId,
			readResource,
			lang: "none",
			articleId: "test-mermaid-src",
			title: "",
		}).parse();
		expect(readResource).toHaveBeenCalledWith("./chart.mermaid");
		expect(loadSpy).toHaveBeenCalledWith('pie title Items\n"A" : 3');
		expect(toHierarchical(actual)).toEqual([
			{
				type: "block",
				title: "Fig",
				metadata: { type: "diagram", diagramType: DiagramType.mermaid },
				items: [
					{ type: "text", text: "Pie" },
					{ type: "text", text: "A" },
				],
			},
		]);
	});

	it("skips plant-uml when diagramRendererServerUrl is not set", async () => {
		const content: JSONContent[] = [
			{
				type: "diagrams",
				attrs: {
					diagramName: DiagramType["plant-uml"],
					content: "@startuml\nAlice -> Bob\n@enduml",
				},
			},
		];
		const actual = await new SearchArticleContentParser({
			items: content,
			getFragmentItems,
			getPropertyValue,
			getLinkId,
			lang: "none",
			articleId: "test-plantuml-skip",
			title: "",
		}).parse();
		expect(toHierarchical(actual)).toEqual([]);
	});

	it("indexes plant-uml as diagram item", async () => {
		const plantUmlToSvgSpy = jest
			.spyOn(plantUmlToSvgModule, "plantUmlToSvg")
			.mockResolvedValue("<svg><text>Alice</text><text>Bob</text></svg>");
		const content: JSONContent[] = [
			{
				type: "diagrams",
				attrs: {
					diagramName: DiagramType["plant-uml"],
					content: "@startuml\nAlice -> Bob\n@enduml",
				},
			},
		];
		const actual = await new SearchArticleContentParser({
			items: content,
			getFragmentItems,
			getPropertyValue,
			getLinkId,
			diagramRendererServerUrl: "random-url",
			lang: "none",
			articleId: "test-plantuml",
			title: "",
		}).parse();
		expect(plantUmlToSvgSpy).toHaveBeenCalledWith("@startuml\nAlice -> Bob\n@enduml", "random-url");
		expect(toHierarchical(actual)).toEqual([
			{
				type: "block",
				title: "",
				metadata: { type: "diagram", diagramType: DiagramType["plant-uml"] },
				items: [
					{ type: "text", text: "Alice" },
					{ type: "text", text: "Bob" },
				],
			},
		]);
	});

	it("indexes db-table blockMd as text label and field table", async () => {
		const content: JSONContent[] = [
			{
				type: "blockMd",
				attrs: {
					text: "[db-table:MyTable:./tables.yaml]",
					tag: [
						{
							name: "Db-table",
							attributes: {
								object: {
									code: "MyTable",
									title: { default: "My Table Title" },
									description: null,
									fields: [
										{
											code: "ID",
											title: { default: "Identifier" },
											sqlType: "int",
											primary: true,
											nullable: false,
										},
										{
											code: "Name",
											title: { default: "Full Name" },
											sqlType: "varchar",
											nullable: false,
										},
									],
								},
							},
						},
					],
				},
			},
		];
		const actual = await new SearchArticleContentParser({
			items: content,
			getFragmentItems,
			getPropertyValue,
			getLinkId,
			lang: "none",
			articleId: "test-dbtable",
			title: "",
		}).parse();
		expect(toHierarchical(actual)).toEqual([
			{ type: "text", text: "MyTable" },
			{ type: "text", text: "My Table Title" },
			{ type: "text", text: "ID" },
			{ type: "text", text: "int" },
			{ type: "text", text: "Identifier" },
			{ type: "text", text: "Name" },
			{ type: "text", text: "varchar" },
			{ type: "text", text: "Full Name" },
		]);
	});

	it("indexes db-table with no title using code only", async () => {
		const content: JSONContent[] = [
			{
				type: "blockMd",
				attrs: {
					text: "[db-table:Bare:./tables.yaml]",
					tag: [
						{
							name: "Db-table",
							attributes: {
								object: {
									code: "Bare",
									title: null,
									fields: [{ code: "ID", sqlType: "int" }],
								},
							},
						},
					],
				},
			},
		];
		const actual = await new SearchArticleContentParser({
			items: content,
			getFragmentItems,
			getPropertyValue,
			getLinkId,
			lang: "none",
			articleId: "test-dbtable-bare",
			title: "",
		}).parse();
		expect(toHierarchical(actual)).toEqual([
			{ type: "text", text: "Bare" },
			{ type: "text", text: "ID" },
			{ type: "text", text: "int" },
		]);
	});

	it("indexes db-diagram via getDbDiagramTexts callback", async () => {
		const texts = ["Order: Sales Order", "ID", "Order ID", "int", "Amount", "decimal"];
		const getDbDiagramTexts = jest.fn(async (_src: string, _tags: string, _primary: string) => texts);
		const content: JSONContent[] = [
			{
				type: "blockMd",
				attrs: {
					text: "[db-diagram:./diagrams/Sales.yaml]",
					tag: [
						{
							name: "Db-diagram",
							attributes: { src: "./diagrams/Sales.yaml", tags: "finance", primary: "Order" },
						},
					],
				},
			},
		];
		const actual = await new SearchArticleContentParser({
			items: content,
			getFragmentItems,
			getPropertyValue,
			getLinkId,
			getDbDiagramTexts,
			lang: "none",
			articleId: "test-dbdiagram",
			title: "",
		}).parse();
		expect(getDbDiagramTexts).toHaveBeenCalledWith("./diagrams/Sales.yaml", "finance", "Order");
		expect(toHierarchical(actual)).toEqual([
			{
				type: "block",
				title: "",
				metadata: { type: "diagram", diagramType: "Db-diagram" },
				items: texts.map((text) => ({ type: "text", text })),
			},
		]);
	});

	it("skips db-diagram when getDbDiagramTables is not provided", async () => {
		const content: JSONContent[] = [
			{
				type: "blockMd",
				attrs: {
					text: "[db-diagram:./diagrams/Foo.yaml]",
					tag: [
						{
							name: "Db-diagram",
							attributes: { src: "./diagrams/Foo.yaml", tags: "", primary: "" },
						},
					],
				},
			},
		];
		const actual = await new SearchArticleContentParser({
			items: content,
			getFragmentItems,
			getPropertyValue,
			getLinkId,
			lang: "none",
			articleId: "test-dbdiagram-skip",
			title: "",
		}).parse();
		expect(toHierarchical(actual)).toEqual([]);
	});

	it("does not throw 'finish called with an open block' for a collapsible note inside a table cell", async () => {
		const note = (title: string, items: JSONContent[]): JSONContent => ({
			type: "note",
			attrs: { type: "lab", title, collapsed: true },
			content: items,
		});
		const content: JSONContent[] = [
			{
				type: "table",
				attrs: { header: "row" },
				content: [
					{
						type: "tableRow",
						content: [
							{
								type: "tableCell",
								content: [
									note("Outer", [
										note("Inner", [
											{ type: "paragraph", content: [{ type: "text", text: "Content" }] },
										]),
									]),
								],
							},
						],
					},
				],
			},
		];
		const actual = await new SearchArticleContentParser({
			items: content,
			getFragmentItems,
			getPropertyValue,
			getLinkId,
			lang: "none",
			articleId: "test-table-note",
			title: "",
		}).parse();
		expect(toHierarchical(actual)).toEqual([
			{
				type: "block",
				title: "Outer",
				items: [{ type: "block", title: "Inner", items: [{ type: "text", text: "Content" }] }],
			},
		]);
	});

	it("awaits async cell content (deferred fragment) before finishing", async () => {
		const deferredFragment = (id: string) =>
			new Promise<JSONContent[] | undefined>((resolve) =>
				setTimeout(
					() =>
						resolve(
							id === "frag-1"
								? [{ type: "paragraph", content: [{ type: "text", text: "Fragment text" }] }]
								: undefined,
						),
					0,
				),
			);
		const content: JSONContent[] = [
			{
				type: "table",
				attrs: { header: "row" },
				content: [
					{
						type: "tableRow",
						content: [
							{
								type: "tableCell",
								content: [
									{
										type: "note",
										attrs: { type: "lab", title: "TTT", collapsed: true },
										content: [{ type: "fragment", attrs: { id: "frag-1" } }],
									},
								],
							},
						],
					},
				],
			},
		];
		const actual = await new SearchArticleContentParser({
			items: content,
			getFragmentItems: deferredFragment,
			getPropertyValue,
			getLinkId,
			lang: "none",
			articleId: "test-table-fragment",
			title: "",
		}).parse();
		expect(toHierarchical(actual)).toEqual([
			{ type: "block", title: "TTT", items: [{ type: "text", text: "Fragment text" }] },
		]);
	});

	it("ignores blockMd with unknown tag name", async () => {
		const content: JSONContent[] = [
			{
				type: "blockMd",
				attrs: {
					text: "[unknown-tag:foo]",
					tag: [{ name: "Unknown-tag", attributes: {} }],
				},
			},
		];
		const actual = await new SearchArticleContentParser({
			items: content,
			getFragmentItems,
			getPropertyValue,
			getLinkId,
			lang: "none",
			articleId: "test-unknown-tag",
			title: "",
		}).parse();
		expect(toHierarchical(actual)).toEqual([]);
	});
});

describe("RemoteSearchArticleContentParser", () => {
	it("remoteVersion stores diagram definition and does not extract display texts", async () => {
		const extractSpy = jest
			.spyOn(extractTextsMermaidModule, "extractTextsMermaid")
			.mockResolvedValue(["Should not be used"]);
		const content: JSONContent[] = [
			{
				type: "diagrams",
				attrs: {
					diagramName: DiagramType.mermaid,
					content: "graph TD\nA[Remote] --> B[Index]",
					title: "Remote diagram",
				},
			},
		];
		const actual = await new RemoteSearchArticleContentParser({
			items: content,
			getFragmentItems,
			getPropertyValue,
			lang: "none",
			remoteVersion: new SemVer("0.0.6"),
		}).parse();
		expect(extractSpy).not.toHaveBeenCalled();
		expect(actual).toEqual([
			{
				type: "text",
				text: "Remote diagram",
			},
			{
				type: "text",
				text: "graph TD\nA[Remote] --> B[Index]",
			},
		]);
	});

	it("remoteVersion uses src definition when available", async () => {
		const readResource = jest.fn(async (src: string) => {
			if (src === "./exists.mermaid") return "flowchart LR\nA --> B";
			return undefined;
		});
		const content: JSONContent[] = [
			{
				type: "diagrams",
				attrs: {
					diagramName: DiagramType.mermaid,
					src: "./exists.mermaid",
					title: "From file",
				},
			},
			{
				type: "diagrams",
				attrs: {
					diagramName: DiagramType.mermaid,
					src: "./missing.mermaid",
					title: "Missing",
				},
			},
		];
		const actual = await new RemoteSearchArticleContentParser({
			items: content,
			getFragmentItems,
			getPropertyValue,
			lang: "none",
			readResource,
			remoteVersion: new SemVer("0.0.6"),
		}).parse();
		expect(readResource).toHaveBeenCalledWith("./exists.mermaid");
		expect(readResource).toHaveBeenCalledWith("./missing.mermaid");
		expect(actual).toEqual([
			{
				type: "text",
				text: "From file",
			},
			{
				type: "text",
				text: "flowchart LR\nA --> B",
			},
			{
				type: "text",
				text: "Missing",
			},
		]);
	});

	it("remoteVersion 0.0.7+ stores diagram in diagram type", async () => {
		const content: JSONContent[] = [
			{
				type: "diagrams",
				attrs: {
					diagramName: DiagramType.mermaid,
					content: "graph TD\nA[Remote] --> B[Index]",
					title: "Remote diagram",
				},
			},
		];
		const actual = await new RemoteSearchArticleContentParser({
			items: content,
			getFragmentItems,
			getPropertyValue,
			lang: "none",
			remoteVersion: new SemVer("0.0.7"),
		}).parse();
		expect(actual).toEqual([
			{
				type: "diagram",
				diagramType: DiagramType.mermaid,
				title: "Remote diagram",
				items: [{ type: "text", text: "graph TD\nA[Remote] --> B[Index]" }],
			},
		]);

		const actual2 = await new RemoteSearchArticleContentParser({
			items: content,
			getFragmentItems,
			getPropertyValue,
			lang: "none",
			remoteVersion: new SemVer("0.1.6"),
		}).parse();
		expect(actual2).toEqual([
			{
				type: "diagram",
				diagramType: DiagramType.mermaid,
				title: "Remote diagram",
				items: [{ type: "text", text: "graph TD\nA[Remote] --> B[Index]" }],
			},
		]);
	});
});
