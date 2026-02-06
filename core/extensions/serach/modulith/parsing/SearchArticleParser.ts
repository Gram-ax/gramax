import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import resolveModule from "@app/resolveModule/backend";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import Path from "@core/FileProvider/Path/Path";
import type { Article, ArticleProps, Content } from "@core/FileStructue/Article/Article";
import { getExtractHeader } from "@core/FileStructue/Article/parseContent";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import mammothModule from "@dynamicImports/mammoth";
import pdfParse from "@dynamicImports/pdf-parse";
import { resolveLanguage } from "@ext/localization/core/model/Language";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import SearchArticleContentParser from "@ext/serach/modulith/parsing/SearchArticleContentParser";
import SearchArticleContentParserHTML from "@ext/serach/modulith/parsing/SearchArticleContentParserHTML";
import type { SearchArticle, SearchArticleArticleMetadata } from "@ext/serach/modulith/SearchArticle";
import { getLang } from "@ext/serach/modulith/utils/getLang";
import { getValidCatalogItems } from "@ext/serach/modulith/utils/getValidCatalogItems";
import type { Workspace } from "@ext/workspace/Workspace";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { AggregateProgress, type ProgressCallback } from "@ics/modulith-utils";
import type { TypedArray } from "pdfjs-dist/types/display/api";

export type CatalogNameWithSearchArticle = [string, SearchArticle[]];

export class SearchArticleParser {
	constructor(
		private readonly _parser: MarkdownParser,
		private readonly _parserContextFactory: ParserContextFactory,
		private readonly _parseResources: boolean,
	) {}

	async getAllCatalogSearchArticles(
		ws: Workspace,
		progressCallback?: ProgressCallback,
	): Promise<CatalogNameWithSearchArticle[]> {
		const catalogNames = [...ws.getAllCatalogs().keys()];

		const aggProgress = new AggregateProgress({
			progress: {
				count: catalogNames.length,
			},
			onChange: (p) => progressCallback?.(p),
		});

		const promises = catalogNames.map<Promise<[string, SearchArticle[]]>>(async (catalogName, i) => {
			const catalog = await ws.getContextlessCatalog(catalogName);
			const articles = await this.getSearchArticles(ws.path(), catalog, aggProgress.getProgressCallback(i));
			return [catalogName, articles];
		});
		return await Promise.all(promises);
	}

	async getSearchArticles(
		wsPath: WorkspacePath,
		catalog: ReadonlyCatalog,
		progressCallback?: ProgressCallback,
	): Promise<SearchArticle[]> {
		const articles = getValidCatalogItems(catalog);
		const searchArticlesByPath: Map<string, SearchArticle> = new Map();

		const aggProgress = new AggregateProgress({
			progress: {
				count: articles.length,
			},
			onChange: (p) => progressCallback?.(p),
		});

		await articles.mapAsync(async (article, i) => {
			const searchArticle = await this._createSearchArticle(
				wsPath,
				catalog,
				article,
				aggProgress.getProgressCallback(i),
			);

			searchArticlesByPath.set(article.logicPath, searchArticle);
		});

		const searchArticles: SearchArticle[] = [];

		if (catalog.props.title) {
			const lang = catalog.props.language ?? "none";
			searchArticles.push({
				id: this._getCatalogId(wsPath, catalog.name, lang),
				title: catalog.props.title,
				children: [],
				items: [],
				metadata: {
					type: "catalog",
					wsPath,
					catalogId: catalog.name,
					lang,
				},
			});
		}

		if (catalog.props.supportedLanguages?.length) {
			const rootCategoryPath = catalog.getRootCategoryPath();

			for (const supLang of catalog.props.supportedLanguages) {
				if (supLang === catalog.props.language) continue;

				const path = rootCategoryPath.join(new Path(supLang), new Path(CATEGORY_ROOT_FILENAME));

				const langCategory = catalog.findItemByItemPath(path);
				if (!langCategory || !langCategory.props.title) continue;
				searchArticles.push({
					id: this._getCatalogId(wsPath, catalog.name, supLang),
					title: langCategory.props.title,
					children: [],
					items: [],
					metadata: {
						type: "catalog",
						wsPath,
						catalogId: catalog.name,
						lang: supLang,
					},
				});
			}
		}

		articles.forEach((article) => {
			const searchArticle = searchArticlesByPath.get(article.logicPath);
			if (!article.parent || !searchArticlesByPath.has(article.parent.logicPath))
				searchArticles.push(searchArticle);
			else searchArticlesByPath.get(article.parent.logicPath).children.push(searchArticle);
		});

		return searchArticles;
	}

	private async _createSearchArticle(
		wsPath: WorkspacePath,
		catalog: ReadonlyCatalog,
		article: Article,
		progressCallback?: ProgressCallback,
	): Promise<SearchArticle> {
		const parsedContent = await this._parseArticleContent(article, catalog);
		const title = parsedContent ? (getExtractHeader(parsedContent) ?? article.getTitle()) : article.getTitle();

		const aggProgress = new AggregateProgress({
			progress: {
				count: 2,
			},
			onChange: (p) => progressCallback?.(p),
		});

		const { searchArticle, resources } = await this._parseItem(
			wsPath,
			article,
			title,
			parsedContent,
			catalog,
			aggProgress.getProgressCallback(0),
		);

		if (resources.length === 0) {
			aggProgress.setProgress(1, 1);
		} else {
			const resourcesProgress = new AggregateProgress({
				progress: {
					count: resources.length,
				},
				onChange: (p) => aggProgress.setProgress(1, p),
			});

			const rm = parsedContent.parsedContext.getResourceManager();

			const resourceArticles = (
				await resources.mapAsync(async (x, i) => {
					const pc = resourcesProgress.getProgressCallback(i);

					try {
						if (x.extension === "docx") {
							return await this._parseResourceDocx(
								wsPath,
								article,
								x.nameWithExtension,
								await rm.getContent(x),
								catalog,
								(searchArticle.metadata as SearchArticleArticleMetadata).properties,
								pc,
							);
						}
						if (x.extension === "pdf") {
							return await this._parseResourcePdf(
								wsPath,
								article,
								x.nameWithExtension,
								await rm.getContent(x),
								catalog,
								(searchArticle.metadata as SearchArticleArticleMetadata).properties,
								pc,
							);
						}
					} catch (e) {
						console.error(e);
						return null;
					} finally {
						pc(1);
					}
				})
			)
				.flat()
				.filter((x) => x != null);

			searchArticle.children = resourceArticles;
		}

		return searchArticle;
	}

	private async _parseResourceDocx(
		wsPath: WorkspacePath,
		article: Article<ArticleProps>,
		file: string,
		data: Buffer,
		catalog: ReadonlyCatalog,
		properties: Record<string, unknown>,
		progressCallback?: ProgressCallback,
	): Promise<SearchArticle | null> {
		if (!data) return null;

		const mammoth = await mammothModule();
		const html = (
			await mammoth.convertToHtml({
				...(getExecutingEnvironment() !== "next"
					? {
							arrayBuffer: data.buffer as ArrayBuffer,
						}
					: {
							buffer: data,
						}),
			})
		).value;

		progressCallback?.(0.75);
		const domParser = resolveModule("getDOMParser")();
		const doc = domParser.parseFromString(`<root>${html}</root>`, "text/xml");
		const parsed = await new SearchArticleContentParserHTML(doc.firstChild.childNodes).parse();
		progressCallback?.(1);
		return {
			id: this._getResourceArticleId(wsPath, article.logicPath, file),
			title: file,
			children: [],
			items: parsed,
			metadata: {
				type: "file",
				wsPath,
				catalogId: catalog.name,
				lang: getLang(article.logicPath, catalog.props.language),
				properties,
			},
		};
	}

	private async _parseResourcePdf(
		wsPath: WorkspacePath,
		article: Article<ArticleProps>,
		file: string,
		data: Buffer,
		catalog: ReadonlyCatalog,
		properties: Record<string, unknown>,
		progressCallback?: ProgressCallback,
	): Promise<SearchArticle | null> {
		if (!data) return null;

		const aggProgress = new AggregateProgress({
			progress: {
				weights: [95, 5],
			},
			onChange: (p) => progressCallback?.(p),
		});

		const pdf = await pdfParse();
		const text: string = await pdf.pdfToMarkdown(data as unknown as TypedArray, aggProgress.getProgressCallback(0));
		const parseCtx = await this._parserContextFactory.fromArticle(article, catalog, resolveLanguage(), true);

		try {
			const mdParsed = (await this._parser.parse(text, parseCtx)).editTree;
			const items = await new SearchArticleContentParser(
				mdParsed.content,
				() => null,
				() => null,
				() => null,
			).parse();

			aggProgress.setProgress(1, 1);
			return {
				id: this._getResourceArticleId(wsPath, article.logicPath, file),
				title: file,
				children: [],
				items,
				metadata: {
					type: "file",
					wsPath,
					catalogId: catalog.name,
					lang: getLang(article.logicPath, catalog.props.language),
					properties,
				},
			};
		} catch (error) {
			console.error(error);
			console.log({ path: article.ref.path.toString(), file });
			return null;
		}
	}

	private async _parseItem(
		wsPath: WorkspacePath,
		article: Article<ArticleProps>,
		title: string,
		parsedContent: Content,
		catalog: ReadonlyCatalog,
		progressCallback?: ProgressCallback,
	): Promise<{ searchArticle: SearchArticle; resources: Path[] }> {
		const resources: Path[] = [];

		const getSnippetItems = async (id: string) => {
			const snippetContent = catalog.customProviders.snippetProvider.getArticle(id)?.parsedContent;
			if (!snippetContent) return undefined;
			return (await snippetContent.read())?.editTree?.content ?? undefined;
		};

		const getPropertyValue = (id: string) => {
			const prop = article.props?.properties?.find((x) => x.name === id);
			return prop?.value?.join(", ");
		};

		const getLinkId = (fileName: Path) => {
			if (!this._parseResources || (fileName.extension !== "docx" && fileName.extension !== "pdf")) {
				return undefined;
			}

			resources.push(fileName);
			return this._getResourceArticleId(wsPath, article.logicPath, fileName.nameWithExtension);
		};

		const res: SearchArticle = {
			id: this._getArticleId(wsPath, article.logicPath),
			title,
			children: [],
			items: parsedContent
				? await new SearchArticleContentParser(
						parsedContent.editTree.content,
						getSnippetItems,
						getPropertyValue,
						getLinkId,
					).parse()
				: [],
			metadata: {
				type: "article",
				catalogId: catalog.name,
				refPath: article.ref.path.value,
				logicPath: article.logicPath,
				wsPath,
				lang: getLang(article.logicPath, catalog.props.language),
				properties: article.props.properties
					? Object.fromEntries(article.props.properties.map((x) => [x.name, x.value ?? true]))
					: {},
			},
		};

		progressCallback?.(1);

		return {
			searchArticle: res,
			resources,
		};
	}

	private async _parseArticleContent(article: Article, catalog: ReadonlyCatalog): Promise<Content | undefined> {
		const parsed = await article.parsedContent.read();
		if (parsed) return parsed;

		const parseCtx = await this._parserContextFactory.fromArticle(article, catalog, resolveLanguage(), true);
		try {
			const res = await this._parser.parse(article.content, parseCtx);
			return res;
		} catch {
			return;
		}
	}

	private _getResourceArticleId(wsPath: WorkspacePath, articleLogicPath: string, resourceName: string) {
		return `${this._getArticleId(wsPath, articleLogicPath)}#file#${resourceName}`;
	}

	private _getArticleId(wsPath: WorkspacePath, articleLogicPath: string) {
		return `${wsPath}#${articleLogicPath}`;
	}

	private _getCatalogId(wsPath: WorkspacePath, catalogName: string, lang: string) {
		return `catalog#${wsPath}#${catalogName}#${lang}`;
	}
}
