import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import { resolveResourceReadSource } from "@core/FileProvider/ResourceReadSource";
import type { Article, ArticleProps, Content } from "@core/FileStructue/Article/Article";
import { extractHeader } from "@core/FileStructue/Article/extractHeader";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { XxHash } from "@core/Hash/Hasher";
import type ResourceManager from "@core/Resource/ResourceManager";
import DbDiagram from "@core-ui/DbDiagram";
import { resolveLanguage } from "@ext/localization/core/model/Language";
import type MarkdownParser from "@ext/markdown/core/Parser/Parser";
import type ParserContextFactory from "@ext/markdown/core/Parser/ParserContext/ParserContextFactory";
import { getFragmentLegacyPath } from "@ext/markdown/elements/fragment/logic/getFragmentLegacyPath";
import type { PropertyValue } from "@ext/properties/models";
import { extractTextsSvg } from "@ext/serach/modulith/parsing/extractTextsSvg";
import { getArticleId, getResourceArticleId } from "@ext/serach/modulith/parsing/getArticleId";
import RemoteSearchArticleContentParser from "@ext/serach/modulith/parsing/RemoteSearchArticleContentParser";
import SearchArticleContentParser from "@ext/serach/modulith/parsing/SearchArticleContentParser";
import {
	isResourceParseFormat,
	type ResourceParseClient,
} from "@ext/serach/modulith/resourceParse/ResourceParseClient";
import type {
	RemoteSearchArticle,
	SearchArticle,
	SearchArticleArticleMetadata,
	SearchArticleFileMetadata,
	SearchArticleItemMetadata,
	SearchArticleItems,
} from "@ext/serach/modulith/SearchArticle";
import type { FoundArticle } from "@ext/serach/modulith/search/ModulithSearchClient";
import { getLang } from "@ext/serach/modulith/utils/getLang";
import type { TableDB } from "@ext/tableDB/table";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import type { Article as ModulithArticle } from "@ics/article-search/article";
import { AggregateProgress, type MultiLock, type ProgressCallback } from "@ics/article-search-utils";
import type { SemVer } from "semver";

export type ResourcesInfo = {
	fp: FileProvider;
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
	tablesManager: TableDB;
}

export class SearchArticleParser {
	constructor(private readonly _options: SearchArticleParserOptions) {}

	async getSearchArticles(
		wsPath: WorkspacePath,
		fp: FileProvider,
		catalog: ReadonlyCatalog,
		articles: Article[],
		withResources: boolean,
		withRemote?: boolean,
		progressCallback?: ProgressCallback,
	): Promise<{
		searchArticles: SearchArticle[];
		resourcesInfo: ResourcesInfo[];
		remoteSearchArticles?: RemoteSearchArticle[];
	}> {
		const searchArticlesByPath: Map<string, SearchArticle> = new Map();
		const remoteSearchArticlesByPath: Map<string, RemoteSearchArticle> | undefined = withRemote
			? new Map()
			: undefined;
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
				fp,
				catalog,
				article,
				withResources && this._options.resourceParseClient != null,
				withRemote,
				aggProgress.getProgressCallback(i),
			);

			searchArticlesByPath.set(article.logicPath, searchArticle);
			if (remoteSearchArticle) {
				remoteSearchArticlesByPath?.set(article.logicPath, remoteSearchArticle);
			}

			if (withResources) {
				resourcesInfo.push({
					fp,
					article,
					resources,
					parsedContent,
					properties: searchArticle.metadata.properties,
				});
			}
		});

		const searchArticles: SearchArticle[] = [];
		const remoteSearchArticles: RemoteSearchArticle[] | undefined = withRemote ? [] : undefined;

		articles.forEach((article) => {
			const searchArticle = searchArticlesByPath.get(article.logicPath);
			if (!article.parent || !searchArticlesByPath.has(article.parent.logicPath))
				searchArticles.push(searchArticle);
			else searchArticlesByPath.get(article.parent.logicPath).children.push(searchArticle);

			if (!remoteSearchArticles) return;
			const remoteSearchArticle = remoteSearchArticlesByPath?.get(article.logicPath);
			if (!remoteSearchArticle) return;

			if (!article.parent || !remoteSearchArticlesByPath?.has(article.parent.logicPath))
				remoteSearchArticles.push(remoteSearchArticle);
			else remoteSearchArticlesByPath?.get(article.parent.logicPath)?.children.push(remoteSearchArticle);
		});

		return { searchArticles, resourcesInfo, remoteSearchArticles };
	}

	async parseResourceArticles(
		resources: Path[],
		rm: ResourceManager,
		fp: FileProvider,
		wsPath: WorkspacePath,
		article: Article<ArticleProps>,
		catalog: ReadonlyCatalog,
		properties: Record<string, unknown>,
		payloads: FoundArticle<SearchArticleFileMetadata>[],
		resLock: MultiLock,
		progressCallback?: ProgressCallback,
	): Promise<{
		searchArticles: ModulithArticle<SearchArticleFileMetadata, SearchArticleItemMetadata>[];
		unchangedResources: string[];
	}> {
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
			await resources.mapAsync<ModulithArticle<SearchArticleFileMetadata, SearchArticleItemMetadata>>(
				async (x, i) => {
					const pc = aggProgress.getProgressCallback(i);
					const release = await resLock.lock(`${catalog.name}#${x.nameWithExtension}`);
					try {
						if (!isResourceParseFormat(x.extension) || !this._options.resourceParseClient) return null;

						const id = getResourceArticleId(wsPath, article.logicPath, x.nameWithExtension);
						const exHash = hashById.get(id);
						const client = this._options.resourceParseClient;
						let hash: string;
						let items: SearchArticleItems | undefined;
						if (client.parseResourceFile) {
							const fallbackPath = getFragmentLegacyPath(rm.basePath, rm.rootPath)?.(x);
							const workerResult = await client.parseResourceFile(
								{
									source: resolveResourceReadSource(
										fp,
										fallbackPath ? [rm.getAbsolutePath(x), fallbackPath] : [rm.getAbsolutePath(x)],
									),
									articleId: id,
									title: x.nameWithExtension,
									format: x.extension,
									knownHash: exHash,
								},
								pc,
							);
							if (!workerResult) return null;
							hash = workerResult.hash;
							if (exHash && exHash === hash) {
								unchangedResources.push(id);
								return null;
							}
							items = workerResult.items;
						} else {
							const data = await rm.getContent(x);
							if (!data) return null;
							hash = String(XxHash.single(data));
							if (exHash && exHash === hash) {
								unchangedResources.push(id);
								return null;
							}
							items = await client.parseResource(id, x.nameWithExtension, x.extension, data, pc);
						}

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
								lang: getLang(
									article.logicPath,
									catalog.props.language,
									catalog.props.supportedLanguages,
								),
								properties,
								refPath: article.ref.path.value,
							},
						};
					} catch (e) {
						console.warn(
							`Failed to parse resource in SearchArticleParser.parseResourceArticles ${catalog.name}/${x.nameWithExtension}`,
							e,
						);
						return null;
					} finally {
						pc(1);
						release();
					}
				},
			)
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
		fp: FileProvider,
		catalog: ReadonlyCatalog,
		article: Article,
		withResources: boolean,
		withRemote?: boolean,
		progressCallback?: ProgressCallback,
	): Promise<{
		searchArticle: ModulithArticle<SearchArticleArticleMetadata, SearchArticleItemMetadata>;
		remoteSearchArticle?: RemoteSearchArticle;
		parsedContent: Content;
		resources: Path[];
	}> {
		const parsedContent = await this._parseArticleContent(article, catalog);
		const title = parsedContent ? (extractHeader(parsedContent) ?? article.getTitle()) : article.getTitle();

		const resources: Path[] = [];

		const getFragmentItems = async (id: string) => {
			const fragmentContent = catalog.customProviders.fragmentProvider.getArticle(id)?.parsedContent;
			if (!fragmentContent) return undefined;
			return (await fragmentContent.read())?.editTree?.content ?? undefined;
		};

		const getPropertyValue = (id: string) => {
			const prop = article.props?.properties?.find((x) => x.id === id);
			return prop?.value?.join(", ");
		};

		const getLinkId = (fileName: Path) => {
			if (!isResourceParseFormat(fileName.extension) || !withResources) {
				return undefined;
			}

			resources.push(fileName);
			return getResourceArticleId(wsPath, article.logicPath, fileName.nameWithExtension);
		};

		const readResource = async (src: string) => {
			if (!withResources || !parsedContent) return undefined;
			try {
				const buffer = await parsedContent.parsedContext.getResourceManager().getContent(new Path(src));
				if (buffer == null) return undefined;
				const text = buffer.toString();
				return text || undefined;
			} catch {
				return undefined;
			}
		};

		const getDbDiagramTexts = async (src: string, tags: string, primary: string): Promise<string[] | undefined> => {
			if (!withResources || !parsedContent) return undefined;
			try {
				const rm = parsedContent.parsedContext.getResourceManager();
				const diagramRef = fp.getItemRef(rm.getAbsolutePath(new Path(src)));
				const diagram = new DbDiagram(this._options.tablesManager, fp);
				await diagram.addDiagram(diagramRef, tags, "default", rm.rootPath, primary || undefined);
				return extractTextsSvg(diagram.getSvg());
			} catch {
				return undefined;
			}
		};

		const articleLang = getLang(article.logicPath, catalog.props.language, catalog.props.supportedLanguages);
		const metadata: SearchArticleArticleMetadata = {
			type: "article",
			catalogId: catalog.name,
			refPath: article.ref.path.value,
			logicPath: article.logicPath,
			wsPath,
			lang: articleLang,
			properties: convertProperties(article.props.properties),
		};

		const articleId = getArticleId(wsPath, article.logicPath);

		const localItems = parsedContent
			? await new SearchArticleContentParser({
					articleId,
					title,
					items: parsedContent.editTree.content,
					getFragmentItems,
					getPropertyValue,
					getLinkId,
					readResource,
					getDbDiagramTexts,
					diagramRendererServerUrl: this._options.diagramRendererServerUrl,
					lang: articleLang,
				}).parse()
			: undefined;

		const searchArticle: ModulithArticle<SearchArticleArticleMetadata, SearchArticleItemMetadata> = {
			id: articleId,
			title,
			children: [],
			items: localItems,
			metadata,
		};

		let remoteSearchArticle: RemoteSearchArticle | undefined;
		if (withRemote && this._options.remoteVersion) {
			const remoteItems = parsedContent
				? await new RemoteSearchArticleContentParser({
						items: parsedContent.editTree.content,
						getFragmentItems,
						getPropertyValue,
						readResource,
						remoteVersion: this._options.remoteVersion,
						lang: articleLang,
					}).parse()
				: [];

			remoteSearchArticle = {
				id: getArticleId(wsPath, article.logicPath),
				title,
				children: [],
				items: remoteItems,
				metadata,
			};
		}

		progressCallback?.(1);

		return { searchArticle, remoteSearchArticle, parsedContent, resources };
	}

	private async _parseArticleContent(article: Article, catalog: ReadonlyCatalog): Promise<Content | undefined> {
		const parsed = await article.parsedContent.read();
		if (parsed) return parsed;

		const parseCtx = await this._options.parserContextFactory.fromArticle(article, catalog, resolveLanguage());
		try {
			const res = await this._options.parser.parse(await article.getContent(), parseCtx);
			return res;
		} catch {
			return;
		}
	}
}

const convertProperties = (properties: PropertyValue[] | undefined) => {
	if (!properties) return {};
	return Object.fromEntries(properties.map((x) => [x.id, isEmptyArray(x.value) ? true : (x.value ?? true)]));
};

const isEmptyArray = (value: unknown) => {
	return Array.isArray(value) && value.length === 0;
};
