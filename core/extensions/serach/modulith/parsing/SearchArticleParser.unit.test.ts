import DiagramType from "@core/components/Diagram/DiagramType";
import Path from "@core/FileProvider/Path/Path";
import type { Article, Content } from "@core/FileStructue/Article/Article";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { XxHash } from "@core/Hash/Hasher";
import { MultiLock } from "@ics/article-search-utils";
import { getResourceArticleId } from "./getArticleId";
import { SearchArticleParser } from "./SearchArticleParser";

describe("SearchArticleParser", () => {
	beforeAll(async () => await XxHash.init());

	it("does not read diagram resources when resource search is disabled", async () => {
		const resourceManager = {
			getContent: jest.fn(),
			getAbsolutePath: jest.fn(),
		};
		const parsedContent = {
			editTree: {
				content: [
					{
						type: "diagrams",
						attrs: { diagramName: DiagramType.mermaid, src: "./chart.mermaid" },
					},
					{
						type: "blockMd",
						attrs: {
							tag: [{ name: "Db-diagram", attributes: { src: "./diagrams/Sales.yaml" } }],
						},
					},
				],
			},
			parsedContext: { getResourceManager: () => resourceManager },
		} as unknown as Content;
		const article = {
			logicPath: "article.md",
			ref: { path: { value: "article.md" } },
			props: { properties: [] },
			getTitle: () => "Article",
			parsedContent: { read: async () => parsedContent },
		} as unknown as Article;
		const fileProvider = { getItemRef: jest.fn() };
		const catalog = {
			name: "catalog",
			props: { language: "none" },
			customProviders: { fragmentProvider: { getArticle: () => undefined } },
		} as unknown as ReadonlyCatalog;
		const parser = new SearchArticleParser({
			resourceParseClient: undefined,
			tablesManager: {} as never,
		} as never);

		await parser.getSearchArticles("workspace", fileProvider as never, catalog, [article], false, false);

		expect(resourceManager.getContent).not.toHaveBeenCalled();
		expect(fileProvider.getItemRef).not.toHaveBeenCalled();
	});

	it("delegates resource file reading to the resource parse worker", async () => {
		const resourceManager = {
			getContent: jest.fn(),
			getAbsolutePath: jest.fn(() => new Path("/workspace/article/report.docx")),
		};
		const resourceParseClient = {
			parseResource: jest.fn(),
			parseResourceFile: jest.fn().mockResolvedValue({ hash: "new-hash", items: [] }),
		};
		const parser = new SearchArticleParser({
			resourceParseClient,
			tablesManager: {} as never,
		} as never);
		const article = {
			logicPath: "article.md",
			ref: { path: { value: "article.md" } },
			props: { properties: [] },
			getTitle: () => "Article",
		} as unknown as Article;
		const catalog = {
			name: "catalog",
			props: { language: "none" },
		} as unknown as ReadonlyCatalog;

		await parser.parseResourceArticles(
			[new Path("report.docx")],
			resourceManager as never,
			{ kind: "disk" } as never,
			"workspace",
			article,
			catalog,
			{},
			[],
			new MultiLock(),
		);

		expect(resourceManager.getContent).not.toHaveBeenCalled();
		expect(resourceParseClient.parseResourceFile).toHaveBeenCalledWith(
			expect.objectContaining({
				source: { targets: [{ kind: "disk", path: "/workspace/article/report.docx" }] },
				format: "docx",
				title: "report.docx",
			}),
			expect.any(Function),
		);
	});

	it("does not fall back to main-thread reading when worker cannot find a resource file", async () => {
		const resourceManager = {
			getContent: jest.fn(),
			getAbsolutePath: jest.fn(() => new Path("/workspace/article/missing.docx")),
		};
		const resourceParseClient = {
			parseResource: jest.fn(),
			parseResourceFile: jest.fn().mockResolvedValue(null),
		};
		const parser = new SearchArticleParser({
			resourceParseClient,
			tablesManager: {} as never,
		} as never);
		const article = {
			logicPath: "article.md",
			ref: { path: { value: "article.md" } },
			props: { properties: [] },
			getTitle: () => "Article",
		} as unknown as Article;
		const catalog = {
			name: "catalog",
			props: { language: "none" },
		} as unknown as ReadonlyCatalog;

		await parser.parseResourceArticles(
			[new Path("missing.docx")],
			resourceManager as never,
			{ kind: "disk" } as never,
			"workspace",
			article,
			catalog,
			{},
			[],
			new MultiLock(),
		);

		expect(resourceManager.getContent).not.toHaveBeenCalled();
	});

	it("does not parse an unchanged resource in the main process", async () => {
		const data = Buffer.from("unchanged resource");
		const resource = new Path("report.docx");
		const resourceManager = {
			getContent: jest.fn().mockResolvedValue(data),
			getAbsolutePath: jest.fn(() => new Path("/workspace/article/report.docx")),
		};
		const resourceParseClient = {
			parseResource: jest.fn(),
		};
		const parser = new SearchArticleParser({
			resourceParseClient,
			tablesManager: {} as never,
		} as never);
		const article = {
			logicPath: "article.md",
			ref: { path: { value: "article.md" } },
			props: { properties: [] },
			getTitle: () => "Article",
		} as unknown as Article;
		const catalog = {
			name: "catalog",
			props: { language: "none" },
		} as unknown as ReadonlyCatalog;
		const id = getResourceArticleId("workspace", article.logicPath, resource.nameWithExtension);

		const result = await parser.parseResourceArticles(
			[resource],
			resourceManager as never,
			{ kind: "disk" } as never,
			"workspace",
			article,
			catalog,
			{},
			[{ id, metadata: { hash: String(XxHash.single(data)) } }] as never,
			new MultiLock(),
		);

		expect(resourceParseClient.parseResource).not.toHaveBeenCalled();
		expect(result.unchangedResources).toEqual([id]);
	});
});
