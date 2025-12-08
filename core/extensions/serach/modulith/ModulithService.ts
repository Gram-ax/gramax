import { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import { ModulithSearchClient } from "@ext/serach/modulith/ModulithSearchClient";
import { ArticleLanguage, SearchArticle, SearchArticleFilter } from "@ext/serach/modulith/SearchArticle";
import { SearchArticleParser } from "@ext/serach/modulith/parsing/SearchArticleParser";
import { WorkspaceState } from "@ext/serach/modulith/WorkspaceState";
import { ProgressItem, SearcherProgressGenerator, SearchResultItem, SearchResultMarkItem } from "@ext/serach/Searcher";
import { Workspace } from "@ext/workspace/Workspace";
import { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { AggregateProgress, ProgressCallback } from "@ics/modulith-utils";
import { PropertyValue } from "@ext/properties/models";
import { Item } from "@core/FileStructue/Item/Item";
import { Article } from "@core/FileStructue/Article/Article";
import { KeyPhraseArticleSearcherItem } from "@ext/serach/modulith/keyPhrase/KeyPhraseArticleSearcher";
import { getLang } from "@ext/serach/modulith/utils/getLang";
import { getExecutingEnvironment } from "@app/resolveModule/env";

export interface ModulithServiceOptions {
	client: ModulithSearchClient;
	wm: WorkspaceManager;
	sap: SearchArticleParser;
	immediateIndexing?: boolean;
}

export class ModulithService {
	private readonly _stateByWorkspace = new Map<WorkspacePath, WorkspaceState>();

	constructor(private readonly _options: ModulithServiceOptions) {
		_options.wm.onCatalogChange((change) => {
			const ws = this._options.wm.current();
			const state = this._getOrCreateState(ws.path());
			if (_options.immediateIndexing) {
				void this._actualizeCatalog(state, change.catalog);
				state.markIndexedCatalog(change.catalog.name);
			} else {
				state.resetIndexedCatalog(change.catalog.name);
			}
		});

		_options.wm.onCatalogAdd(({ catalog }) => {
			const ws = this._options.wm.current();
			const state = this._getOrCreateState(ws.path());
			if (_options.immediateIndexing) {
				void this._actualizeCatalog(state, catalog);
				state.markIndexedCatalog(catalog.name);
			} else {
				state.resetIndexedCatalog(catalog.name);
			}
		});

		if (_options.immediateIndexing) {
			void this._readAllCatalogs();
		}
	}

	async updateAllCatalogs(): Promise<void> {
		const curWs = this._options.wm.current();
		const state = this._getOrCreateState(curWs.path());
		const prid = state.addProgress();
		const pc = state.getProgressCallback(prid);
		const catalogNames = [...curWs.getAllCatalogs().keys()];

		const aggProgress = new AggregateProgress({
			progress: {
				count: catalogNames.length,
			},
			onChange: (p) => pc(p),
		});

		try {
			await catalogNames.forEachAsync(async (catalogName, i) => {
				const catalog = await curWs.getContextlessCatalog(catalogName);
				await this._actualizeCatalog(state, catalog, aggProgress.getProgressCallback(i));
			});
		} finally {
			state.doneProgress(prid);
		}
	}

	async updateCatalog(catalogName: string) {
		const ws = this._options.wm.current();
		const state = this._getOrCreateState(ws.path());
		const catalog = await ws.getContextlessCatalog(catalogName);
		await this._actualizeCatalog(state, catalog);
	}

	async *progress(): SearcherProgressGenerator {
		const curWs = this._options.wm.current();
		const state = this._getOrCreateState(curWs.path());
		if (!state.hasProgresses()) {
			yield {
				type: "done",
			};

			return;
		}

		let cur: ProgressItem = {
			type: "progress",
			progress: state.getTotalProgress(),
		};

		let resolveNext: (() => void) | null = null;

		const handler = (p: number) => {
			cur = {
				type: "progress",
				progress: p,
			};
			if (resolveNext) {
				resolveNext();
				resolveNext = null;
			}
		};

		state.addProgressSubscriber(handler);

		try {
			while (state.hasProgresses() || cur != undefined) {
				if (cur != undefined) {
					const oldCur = cur;
					cur = undefined;
					yield oldCur;
				} else {
					await new Promise<void>(
						(resolve) =>
							(resolveNext = () => {
								resolve();
								resolveNext = null;
							}),
					);
				}
			}
		} finally {
			state.removeProgressSubscriber(handler);
		}
	}

	async searchBatch({ items }: SearchBatchArgs): Promise<SearchResult[][]> {
		const curWs = this._options.wm.current();
		const state = this._getOrCreateState(curWs.path());

		if (getExecutingEnvironment() !== "static") {
			await this._indexNotIndexedCatalogs(
				state,
				curWs,
				items.flatMap((x) => x.catalogNames),
			);
		}

		const catalogs = new Map<string, ReadonlyCatalog>();
		const pathnamesByLogicPath = new Map<string, string>();

		const getPathname = async (catalog: ReadonlyCatalog, item: Item) => {
			let pathname = pathnamesByLogicPath.get(item.logicPath);
			if (pathname === undefined) {
				pathname = await catalog.getPathname(item);
				pathnamesByLogicPath.set(item.logicPath, pathname);
			}

			return pathname;
		};

		const getCatalog = async (catalogName: string): Promise<ReadonlyCatalog> => {
			let catalog = catalogs.get(catalogName);
			if (catalog === undefined) {
				catalog = await curWs.getContextlessCatalog(catalogName);
				catalogs.set(catalogName, catalog);
			}

			return catalog;
		};

		const getArticleOtherFields = async (
			catalog: ReadonlyCatalog,
			article: Article,
			lang: ArticleLanguage,
		): Promise<Pick<SearchArticleResult, "breadcrumbs" | "pathname" | "properties">> => {
			const rootCategory = resolveRootCategory(catalog, catalog.props, lang === "none" ? undefined : lang);

			const breadcrumbs: SearchArticleResult["breadcrumbs"] = [];

			let parent = article.parent;
			while (parent && parent !== rootCategory) {
				breadcrumbs.unshift({
					pathname: await getPathname(catalog, parent),
					title: parent.getTitle(),
				});

				parent = parent.parent;
			}

			return {
				pathname: await getPathname(catalog, article),
				breadcrumbs,
				properties: article.props.properties ?? [],
			};
		};

		const getArticleOtherFieldsByLogicPath = async (
			catalog: ReadonlyCatalog,
			logicPath: string,
			lang: ArticleLanguage,
		) => {
			const article = catalog.findArticle(logicPath, []);
			return await getArticleOtherFields(catalog, article, lang);
		};

		const searchRes = await this._options.client.searchBatch({
			items: items.map((x) => {
				const filter: SearchArticleFilter = {
					metadata: [
						{
							op: "in",
							key: "catalogId",
							list: x.catalogNames,
						},
					],
				};

				if (x.articlesLanguage) {
					filter.metadata.push({
						op: "eq",
						key: "lang",
						value: x.articlesLanguage,
					});
				}

				if (x.properties) {
					x.properties.forEach((x) =>
						filter.metadata.push({
							op: "eq",
							key: `properties.${x.key}`,
							value: x.value,
						}),
					);
				}

				return {
					query: x.query,
					filter,
				};
			}),
		});

		const keyPhraseRes = items.map((x) => (x.query ? state.keyPhraseSearcher.search(x.query) : []));

		const res: SearchResult[][] = [];
		const maxSearchResult = 50;

		for (let si = 0; si < searchRes.length; si++) {
			const searchBatch = searchRes[si];
			const recsByLogicPath = new Map<string, KeyPhraseArticleSearcherItem>(
				keyPhraseRes[si].map((x) => [x.article.logicPath, x]),
			);
			const catalogs: SearchResult[] = [];
			const batch: SearchResult[] = [];
			let i = 0;
			for (const item of searchBatch) {
				i++;

				const catalog = await getCatalog(item.article.metadata.catalogId);
				const catalogTitle = catalog.props.title ?? catalog.name;
				if (item.article.metadata.type === "catalog") {
					const pathname = await catalog.getPathname();
					catalogs.push({
						type: "catalog",
						catalogName: item.article.metadata.catalogId,
						pathname,
						title: item.title,
					});
				} else if (item.article.metadata.type === "article") {
					if (i > maxSearchResult) {
						continue;
					}

					const isRecommended = recsByLogicPath.delete(item.article.metadata.logicPath);

					const resItem: SearchArticleResult = {
						type: "article",
						refPath: item.article.metadata.refPath,
						isRecommended,
						catalog: {
							name: item.article.metadata.catalogId,
							title: catalogTitle,
						},
						...(await getArticleOtherFieldsByLogicPath(
							catalog,
							item.article.metadata.logicPath,
							item.article.metadata.lang,
						)),
						title: item.title,
						items: item.items,
					};

					if (isRecommended) {
						batch.unshift(resItem);
					} else {
						batch.push(resItem);
					}
				}
			}

			const restRecArticles = await [...recsByLogicPath.values()].mapAsync<SearchResult>(async (x) => {
				const catalogTitle = x.catalog.props.title ?? x.catalog.name;
				return {
					type: "article",
					isRecommended: true,
					refPath: x.article.ref.path.value,
					catalog: {
						name: x.catalog.name,
						title: catalogTitle,
					},
					items: [],
					title: [
						{
							type: "text",
							text: x.article.getTitle(),
						},
					],
					...(await getArticleOtherFields(
						x.catalog,
						x.article,
						getLang(x.article.logicPath, x.catalog.props.language),
					)),
				};
			});

			res.push([...restRecArticles, ...catalogs, ...batch]);
		}

		return res;
	}

	private async _indexNotIndexedCatalogs(
		state: WorkspaceState,
		ws: Workspace,
		catalogNames: string[],
	): Promise<void> {
		const catalogsToIndex: string[] = [];

		for (const catalogName of catalogNames) {
			if (state.hasIndexedCatalog(catalogName)) continue;
			catalogsToIndex.push(catalogName);
		}

		const prid = state.addProgress();
		const aggProgress = new AggregateProgress({
			progress: {
				count: catalogsToIndex.length,
			},
			onChange: (p) => state.setProgress(prid, p),
		});

		try {
			await catalogsToIndex.mapAsync(async (x, i) => {
				const catalog = await ws.getContextlessCatalog(x);
				await this._actualizeCatalog(state, catalog, aggProgress.getProgressCallback(i));
				state.markIndexedCatalog(x);
			}, 1);
		} finally {
			state.doneProgress(prid);
		}
	}

	private async _actualizeCatalog(
		state: WorkspaceState,
		catalog: ReadonlyCatalog,
		progressCallback?: ProgressCallback,
	): Promise<void> {
		const aggProgress = new AggregateProgress({
			progress: {
				weights: [90, 10],
			},
			onChange: (p) => progressCallback?.(p),
		});

		const articles = await this._options.sap.getSearchArticles(
			state.path,
			catalog,
			aggProgress.getProgressCallback(0),
		);

		await this._updateArticles(articles, catalog.name, aggProgress.getProgressCallback(1));
		const catalogArticles = catalog.getItems() as Article[];
		catalogArticles.forEach((x) =>
			state.keyPhraseSearcher.updateArticle({ id: `${state.path}#${x.logicPath}`, article: x, catalog }),
		);
	}

	private async _updateArticles(articles: SearchArticle[], catalogName: string, progressCallback: ProgressCallback) {
		const filter: SearchArticleFilter = {
			metadata: [
				{
					op: "eq",
					key: "catalogId",
					value: catalogName,
				},
			],
		};

		await this._options.client.update({
			articles,
			filter,
			progressCallback,
		});
	}

	private _getOrCreateState(wsPath: WorkspacePath): WorkspaceState {
		let ex = this._stateByWorkspace.get(wsPath);
		if (ex === undefined) {
			ex = new WorkspaceState(wsPath);
			this._stateByWorkspace.set(wsPath, ex);
		}

		return ex;
	}

	private async _readAllCatalogs() {
		const catalogNames = [...this._options.wm.current().getAllCatalogs().keys()];
		await catalogNames.mapAsync((x) => this._options.wm.current().getContextlessCatalog(x));
	}
}

export interface SearchBatchArgs {
	items: {
		query?: string;
		catalogNames: string[];
		properties?: { key: string; value: unknown }[];
		articlesLanguage?: ArticleLanguage;
	}[];
}

export type SearchResult = SearchArticleResult | SearchCatalogResult;

export interface SearchArticleResult {
	type: "article";
	refPath: string;
	isRecommended: boolean;
	catalog: {
		name: string;
		title: string;
	};
	pathname: string;
	breadcrumbs: { title: string; pathname: string }[];
	properties: PropertyValue[];
	title: SearchResultMarkItem[];
	items: SearchResultItem[];
}

export interface SearchCatalogResult {
	type: "catalog";
	catalogName: string;
	pathname: string;
	title: SearchResultMarkItem[];
}
