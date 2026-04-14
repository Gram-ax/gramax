import DiagramType from "@core/components/Diagram/DiagramType";
import type Path from "@core/FileProvider/Path/Path";
import * as extractTextsMermaidModule from "@ext/serach/modulith/parsing/extractTextsMermaid";
import SearchArticleContentParser from "@ext/serach/modulith/parsing/SearchArticleContentParser";
import { afterEach, it, jest } from "@jest/globals";
import type { JSONContent } from "@tiptap/core";
import { SemVer } from "semver";
import testModel1 from "./testModel1.json";
import testModel1Expected from "./testModel1Expected.json";
import testModel2 from "./testModel2.json";
import testModel2Expected from "./testModel2Expected.json";
import testModel3 from "./testModel3.json";
import testModel3Expected from "./testModel3Expected.json";

const getSnippetItems = (id: string) => {
	throw new Error(`getSnippetItems attempt, id: ${id}`);
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
			getSnippetItems,
			getPropertyValue,
			getLinkId,
		}).parse();
		expect(actual).toEqual(testModel1Expected);
	});

	it("test testModel2", async () => {
		const actual = await new SearchArticleContentParser({
			items: testModel2.content,
			getSnippetItems,
			getPropertyValue,
			getLinkId,
		}).parse();
		expect(actual).toEqual(testModel2Expected);
	});

	it("test testModel3", async () => {
		const actual = await new SearchArticleContentParser({
			items: testModel3.content,
			getSnippetItems,
			getPropertyValue,
			getLinkId,
		}).parse();
		expect(actual).toEqual(testModel3Expected);
	});

	it("indexes mermaid display text as separate text items", async () => {
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
			getSnippetItems,
			getPropertyValue,
			getLinkId,
		}).parse();
		expect(actual).toEqual([
			{ type: "text", text: "Flow" },
			{ type: "text", text: "Search" },
			{ type: "text", text: "Done" },
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
			getSnippetItems,
			getPropertyValue,
			getLinkId,
			readResource,
		}).parse();
		expect(readResource).toHaveBeenCalledWith("./chart.mermaid");
		expect(loadSpy).toHaveBeenCalledWith('pie title Items\n"A" : 3');
		expect(actual).toEqual([
			{ type: "text", text: "Fig" },
			{ type: "text", text: "Pie" },
			{ type: "text", text: "A" },
		]);
	});

	it("skips non-mermaid diagrams nodes", async () => {
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
			getSnippetItems,
			getPropertyValue,
			getLinkId,
		}).parse();
		expect(actual).toEqual([]);
	});

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
		const actual = await new SearchArticleContentParser({
			items: content,
			getSnippetItems,
			getPropertyValue,
			getLinkId,
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
		const actual = await new SearchArticleContentParser({
			items: content,
			getSnippetItems,
			getPropertyValue,
			getLinkId,
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
		const actual = await new SearchArticleContentParser({
			items: content,
			getSnippetItems,
			getPropertyValue,
			getLinkId,
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

		const actual2 = await new SearchArticleContentParser({
			items: content,
			getSnippetItems,
			getPropertyValue,
			getLinkId,
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
