import Path from "@core/FileProvider/Path/Path";
import type { Article, ArticleProps, Content } from "@core/FileStructue/Article/Article";
import { extractHeader } from "@core/FileStructue/Article/extractHeader";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { XxHash } from "@core/Hash/Hasher";
import type ResourceManager from "@core/Resource/ResourceManager";
import { resolveLanguage } from "@ext/localization/core/model/Language";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import { getArticleId, getResourceArticleId } from "@ext/serach/modulith/parsing/getArticleId";
import SearchArticleContentParser from "@ext/serach/modulith/parsing/SearchArticleContentParser";
import {
	isResourceParseFormat,
	type ResourceParseClient,
} from "@ext/serach/modulith/resourceParse/ResourceParseClient";
import type {
	SearchArticle,
	SearchArticleArticleMetadata,
	SearchArticleFileMetadata,
} from "@ext/serach/modulith/SearchArticle";
import type { FoundArticle } from "@ext/serach/modulith/search/ModulithSearchClient";
import { getLang } from "@ext/serach/modulith/utils/getLang";
import { getValidCatalogItems } from "@ext/serach/modulith/utils/getValidCatalogItems";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import type { Article as ModulithArticle } from "@ics/modulith-search-domain/article";
import { AggregateProgress, type MultiLock, type ProgressCallback } from "@ics/modulith-utils";
import type { SemVer } from "semver";

export type ResourcesInfo = {
	article: Article;
	resources: Path[];
	parsedContent: Content | undefined;
	properties: Record<string, unknown>;
};

export type CatalogNameWithSearchArticle = [string, SearchArticle[]];

export interface SearchArticleParserOptions {
	parser: MarkdownParser;
	parserContextFactory: ParserContextFactory;
	resourceParseClient: ResourceParseClient | undefined;
	diagramRendererServerUrl?: string;
	remoteVersion?: SemVer;
}

export class SearchArticleParser {
	constructor(private readonly _options: SearchArticleParserOptions) {}

	async getSearchArticles(
		wsPath: WorkspacePath,
		catalog: ReadonlyCatalog,
		withRemote?: boolean,
		progressCallback?: ProgressCallback,
	): Promise<{
		searchArticles: SearchArticle[];
		resourcesInfo: ResourcesInfo[];
		remoteSearchArticles?: SearchArticle[];
	}> {
		const articles = getValidCatalogItems(catalog);
		const searchArticlesByPath: Map<string, SearchArticle> = new Map();
		const remoteSearchArticlesByPath: Map<string, SearchArticle> | undefined = new Map();
		const resourcesInfo: ResourcesInfo[] = [];

		const aggProgress = new AggregateProgress({
			progress: {
				count: articles.length,
			},
			onChange: (p) => progressCallback?.(p),
		});

		await articles.mapAsync(async (article, i) => {
			const { searchArticle, remoteSearchArticle, parsedContent, resources } = await this._createSearchArticle(
				wsPath,
				catalog,
				article,
				withRemote,
				aggProgress.getProgressCallback(i),
			);

			searchArticlesByPath.set(article.logicPath, searchArticle);
			if (remoteSearchArticle) {
				remoteSearchArticlesByPath.set(article.logicPath, remoteSearchArticle);
			}
			resourcesInfo.push({ article, resources, parsedContent, properties: searchArticle.metadata.properties });
		});

		const searchArticles: SearchArticle[] = [];
		const remoteSearchArticles: SearchArticle[] | undefined = withRemote ? [] : undefined;

		articles.forEach((article) => {
			const searchArticle = searchArticlesByPath.get(article.logicPath);
			if (!article.parent || !searchArticlesByPath.has(article.parent.logicPath))
				searchArticles.push(searchArticle);
			else searchArticlesByPath.get(article.parent.logicPath).children.push(searchArticle);

			// Building similar tree for remote articles
			if (!remoteSearchArticles) return;
			const remoteSearchArticle = remoteSearchArticlesByPath.get(article.logicPath);
			if (!remoteSearchArticle) return;

			if (!article.parent || !remoteSearchArticlesByPath.has(article.parent.logicPath))
				remoteSearchArticles.push(remoteSearchArticle);
			else remoteSearchArticlesByPath.get(article.parent.logicPath)?.children.push(remoteSearchArticle);
		});

		return { searchArticles, resourcesInfo, remoteSearchArticles };
	}

	async parseResourceArticles(
		resources: Path[],
		rm: ResourceManager,
		wsPath: WorkspacePath,
		article: Article<ArticleProps>,
		catalog: ReadonlyCatalog,
		properties: Record<string, unknown>,
		payloads: FoundArticle<SearchArticleFileMetadata>[],
		resLock: MultiLock,
		progressCallback?: ProgressCallback,
	): Promise<{ searchArticles: ModulithArticle<SearchArticleFileMetadata>[]; unchangedResources: string[] }> {
		const aggProgress = new AggregateProgress({
			progress: {
				count: resources.length,
			},
			onChange: (p) => progressCallback?.(p),
		});

		const articleId = getArticleId(wsPath, article.logicPath);
		const hashById = new Map<string, string>(payloads.map((x) => [x.id, x.metadata.hash]));

		const unchangedResources: string[] = [];
		const searchArticles = (
			await resources.mapAsync<ModulithArticle<SearchArticleFileMetadata>>(async (x, i) => {
				const pc = aggProgress.getProgressCallback(i);
				const release = await resLock.lock(`${catalog.name}#${x.nameWithExtension}`);
				try {
					if (!isResourceParseFormat(x.extension) || !this._options.resourceParseClient) return null;

					const data = await rm.getContent(x);
					if (!data) return null;

					const id = getResourceArticleId(wsPath, article.logicPath, x.nameWithExtension);
					const hash = String(XxHash.single(data));
					const exHash = hashById.get(id);
					if (exHash && exHash === hash) {
						unchangedResources.push(id);
						return null;
					}

					const items = await this._options.resourceParseClient.parseResource(x.extension, data, pc);
					if (!items) return null;

					hashById.set(id, hash);

					return {
						id,
						title: x.nameWithExtension,
						children: [],
						items,
						metadata: {
							type: "file" as const,
							id,
							hash,
							articleId,
							wsPath,
							catalogId: catalog.name,
							lang: getLang(article.logicPath, catalog.props.language),
							properties,
							refPath: article.ref.path.value,
						},
					};
				} catch (e) {
					console.error(e);
					return null;
				} finally {
					pc(1);
					release();
				}
			})
		).filter((x) => x != null);

		return {
			searchArticles,
			unchangedResources,
		};
	}

	async terminate(): Promise<void> {
		await this._options.resourceParseClient?.terminate();
	}

	private async _createSearchArticle(
		wsPath: WorkspacePath,
		catalog: ReadonlyCatalog,
		article: Article,
		withRemote?: boolean,
		progressCallback?: ProgressCallback,
	): Promise<{
		searchArticle: ModulithArticle<SearchArticleArticleMetadata>;
		remoteSearchArticle?: ModulithArticle<SearchArticleArticleMetadata>;
		parsedContent: Content;
		resources: Path[];
	}> {
		const parsedContent = await this._parseArticleContent(article, catalog);
		const title = parsedContent ? (extractHeader(parsedContent) ?? article.getTitle()) : article.getTitle();

		const { searchArticle, resources } = await this._parseItem(
			wsPath,
			article,
			title,
			parsedContent,
			catalog,
			false,
			progressCallback,
		);

		// For remote articles we take definition of diagrams
		//   so LLM can answer questions about diagrams
		// For local articles we take display text of diagrams
		//   so user can search by diagram display text
		const remoteSearchArticle =
			withRemote === true
				? (await this._parseItem(wsPath, article, title, parsedContent, catalog, true, undefined)).searchArticle
				: undefined;

		return { searchArticle, remoteSearchArticle, parsedContent, resources };
	}

	private async _parseItem(
		wsPath: WorkspacePath,
		article: Article<ArticleProps>,
		title: string,
		parsedContent: Content | undefined,
		catalog: ReadonlyCatalog,
		forRemote?: boolean,
		progressCallback?: ProgressCallback,
	): Promise<{ searchArticle: ModulithArticle<SearchArticleArticleMetadata>; resources: Path[] }> {
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
			if (!isResourceParseFormat(fileName.extension) || !this._options.resourceParseClient) {
				return undefined;
			}

			resources.push(fileName);
			return getResourceArticleId(wsPath, article.logicPath, fileName.nameWithExtension);
		};

		const readResource = async (src: string) => {
			if (!parsedContent) return undefined;
			try {
				const buffer = await parsedContent.parsedContext.getResourceManager().getContent(new Path(src));
				if (buffer == null) return undefined;
				const text = buffer.toString();
				return text || undefined;
			} catch {
				return undefined;
			}
		};

		const res: ModulithArticle<SearchArticleArticleMetadata> = {
			id: getArticleId(wsPath, article.logicPath),
			title,
			children: [],
			items: parsedContent
				? await new SearchArticleContentParser({
						items: parsedContent.editTree.content,
						getSnippetItems,
						getPropertyValue,
						getLinkId,
						readResource,
						diagramRendererServerUrl: this._options.diagramRendererServerUrl,
						remoteVersion: forRemote ? this._options.remoteVersion : undefined,
					}).parse()
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

		const parseCtx = await this._options.parserContextFactory.fromArticle(article, catalog, resolveLanguage());
		try {
			const res = await this._options.parser.parse(article.content, parseCtx);
			return res;
		} catch {
			return;
		}
	}
}
