import { getExecutingEnvironment } from "@app/resolveModule/env";
import type { Article } from "@core/FileStructue/Article/Article";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type { Item } from "@core/FileStructue/Item/Item";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import type { PropertyValue } from "@ext/properties/models";
import type { KeyPhraseArticleSearcherItem } from "@ext/serach/modulith/keyPhrase/KeyPhraseArticleSearcher";
import type { ModulithSearchClient } from "@ext/serach/modulith/ModulithSearchClient";
import type { SearchArticleParser } from "@ext/serach/modulith/parsing/SearchArticleParser";
import type {
	ArticleLanguage,
	SearchArticle,
	SearchArticleFilter,
	SearchArticleMetadata,
} from "@ext/serach/modulith/SearchArticle";
import { AsyncNotifier } from "@ext/serach/modulith/utils/AsyncNotifier";
import { getLang } from "@ext/serach/modulith/utils/getLang";
import { getValidCatalogItems } from "@ext/serach/modulith/utils/getValidCatalogItems";
import { WorkspaceState } from "@ext/serach/modulith/WorkspaceState";
import type {
	ProgressItem,
	PropertyFilter,
	SearcherProgressGenerator,
	SearchResultItem,
	SearchResultMarkItem,
} from "@ext/serach/Searcher";
import type { Workspace } from "@ext/workspace/Workspace";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { AggregateProgress, type FieldsToDotPaths, type ProgressCallback } from "@ics/modulith-utils";

const PROMISES_RESOLVED_MARK = Symbol();

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
			} else {
				state.resetIndexedCatalog(change.catalog.name);
			}
		});

		_options.wm.onCatalogAdd(({ catalog }) => {
			const ws = this._options.wm.current();
			const state = this._getOrCreateState(ws.path());
			if (_options.immediateIndexing) {
				void this._actualizeCatalog(state, catalog);
			} else {
				state.resetIndexedCatalog(catalog.name);
			}
		});

		if (_options.immediateIndexing) {
			void this._readAllCatalogs();
		}
	}

	async *updateIndex({ force, catalogName }: UpdateIndexArgs): SearcherProgressGenerator {
		const curWs = this._options.wm.current();
		const state = this._getOrCreateState(curWs.path());
		const release = await state.lockIndexing();

		try {
			const catalogNames = catalogName ? [catalogName] : [...curWs.getAllCatalogs().keys()];
			yield* this._updateIndexImpl(state, curWs, catalogNames, force !== true);
		} finally {
			release();
		}
	}

	async updateCatalog(catalogName: string, overridePath?: string) {
		const ws = this._options.wm.current();
		const state = this._getOrCreateState(ws.path());
		const catalog = await ws.getContextlessCatalog(catalogName);
		await this._actualizeCatalog(state, catalog, undefined, overridePath);
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

		const notifier = new AsyncNotifier();

		let cur: ProgressItem = {
			type: "progress",
			progress: state.getTotalProgress(),
		};

		const handler = (p: number) => {
			cur = { type: "progress", progress: p };
			notifier.notify();
		};

		state.addProgressSubscriber(handler);

		try {
			while (state.hasProgresses() || cur != undefined) {
				if (cur != undefined) {
					const oldCur = cur;
					cur = undefined;
					yield oldCur;
				} else {
					await notifier.waitNext();
				}
			}
		} finally {
			state.removeProgressSubscriber(handler);
		}
	}

	async searchBatch({ items, signal }: SearchBatchArgs): Promise<SearchResult[][]> {
		const curWs = this._options.wm.current();
		const state = this._getOrCreateState(curWs.path());

		if (getExecutingEnvironment() !== "static") {
			await this._indexNotIndexedCatalogs(
				state,
				curWs,
				items.flatMap((x) => x.catalogNames),
				signal,
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
		): Promise<Pick<SearchArticleResult, "breadcrumbs" | "url" | "properties">> => {
			const rootCategory = resolveRootCategory(catalog, catalog.props, lang === "none" ? undefined : lang);

			const breadcrumbs: SearchArticleResult["breadcrumbs"] = [];

			let parent = article.parent;
			while (parent && parent !== rootCategory) {
				breadcrumbs.unshift({
					url: await getPathname(catalog, parent),
					title: parent.getTitle(),
				});

				parent = parent.parent;
			}

			return {
				url: await getPathname(catalog, article),
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
			signal,
			items: items.map((x) => {
				const metadataFilters: SearchArticleFilter["metadata"][] = [
					{
						op: "in",
						key: "catalogId",
						list: x.catalogNames,
					},
				];

				if (x.articlesLanguage) {
					metadataFilters.push({
						op: "eq",
						key: "lang",
						value: x.articlesLanguage,
					});
				}

				if (x.propertyFilter) {
					metadataFilters.push(convertPropertyFilter(x.propertyFilter));
				}

				return {
					query: x.query,
					filter: {
						metadata: {
							op: "and",
							filters: metadataFilters,
						},
					},
				};
			}),
		});

		// To prevent unnecessary execution of keyPhraseSearcher
		if (signal?.aborted) return [];

		const keyPhraseRes = items.map((x) => (x.query ? state.keyPhraseSearcher.search(x.query) : []));

		const res: SearchResult[][] = [];
		const maxSearchResult = 50;

		for (let si = 0; si < searchRes.length; si++) {
			if (signal?.aborted) break;

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
				const catalogPathname = await catalog.getPathname();
				if (item.article.metadata.type === "catalog") {
					catalogs.push({
						type: "catalog",
						catalogName: item.article.metadata.catalogId,
						url: catalogPathname,
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
							url: catalogPathname,
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
				const catalogPathname = await x.catalog.getPathname();
				return {
					type: "article",
					isRecommended: true,
					refPath: x.article.ref.path.value,
					catalog: {
						name: x.catalog.name,
						title: catalogTitle,
						url: catalogPathname,
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
		signal?: AbortSignal,
	): Promise<void> {
		const release = await state.lockIndexing();
		try {
			if (signal?.aborted) return;
			const gen = this._updateIndexImpl(state, ws, catalogNames, true);
			// eslint-disable-next-line no-unused-vars
			for await (const _ of gen) {
			}
		} finally {
			release();
		}
	}

	private async *_updateIndexImpl(
		state: WorkspaceState,
		ws: Workspace,
		catalogNames: string[],
		checkIndexed: boolean,
	): SearcherProgressGenerator {
		const prid = state.addProgress();

		try {
			const pc = state.getProgressCallback(prid);

			if (checkIndexed === true) {
				catalogNames = catalogNames.filter((x) => !state.hasIndexedCatalog(x));
			}

			if (catalogNames.length === 0) {
				yield {
					type: "done",
				};

				return;
			}

			const notifier = new AsyncNotifier();

			let cur: ProgressItem = {
				type: "progress",
				progress: 0,
			};

			yield cur;

			const handler = (p: number) => {
				cur = { type: "progress", progress: p };
				notifier.notify();
			};

			const aggProgress = new AggregateProgress({
				progress: {
					count: catalogNames.length,
				},
				onChange: (p) => {
					pc(p);
					handler(p);
				},
			});
			const promises = catalogNames.forEachAsync(
				async (catalogName, i) => {
					const catalog = await ws.getContextlessCatalog(catalogName);
					await this._actualizeCatalog(state, catalog, aggProgress.getProgressCallback(i));
				},
				5,
				true,
			);

			let done = false;
			while (!done) {
				if (cur) {
					const old = cur;
					cur = undefined;
					yield old;
				}

				const raceRes = await Promise.race([promises.then(() => PROMISES_RESOLVED_MARK), notifier.waitNext()]);
				done = raceRes === PROMISES_RESOLVED_MARK;
			}

			yield {
				type: "done",
			};
		} finally {
			state.doneProgress(prid);
		}
	}

	private async _actualizeCatalog(
		state: WorkspaceState,
		catalog?: ReadonlyCatalog,
		progressCallback?: ProgressCallback,
		overridePath?: string,
	): Promise<void> {
		if (!catalog) {
			progressCallback?.(1);
			return;
		}

		const aggProgress = new AggregateProgress({
			progress: {
				weights: [90, 10],
			},
			onChange: (p) => progressCallback?.(p),
		});

		const articles = await this._options.sap.getSearchArticles(
			overridePath || state.path,
			catalog,
			aggProgress.getProgressCallback(0),
		);

		await this._updateArticles(articles, catalog.name, aggProgress.getProgressCallback(1));
		const catalogArticles = getValidCatalogItems(catalog);
		catalogArticles.forEach((x) =>
			state.keyPhraseSearcher.updateArticle({
				id: `${overridePath || state.path}#${x.logicPath}`,
				article: x,
				catalog,
			}),
		);

		state.markIndexedCatalog(catalog.name);
	}

	private async _updateArticles(articles: SearchArticle[], catalogName: string, progressCallback: ProgressCallback) {
		const filter: SearchArticleFilter = {
			metadata: {
				op: "eq",
				key: "catalogId",
				value: catalogName,
			},
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
		propertyFilter?: PropertyFilter;
		articlesLanguage?: ArticleLanguage;
	}[];
	signal?: AbortSignal;
}

export type SearchResult = SearchArticleResult | SearchCatalogResult;

export interface SearchArticleResult {
	type: "article";
	refPath: string;
	isRecommended: boolean;
	catalog: {
		name: string;
		title: string;
		url: string;
	};
	url: string;
	breadcrumbs: { title: string; url: string }[];
	properties: PropertyValue[];
	title: SearchResultMarkItem[];
	items: SearchResultItem[];
}

export interface SearchCatalogResult {
	type: "catalog";
	catalogName: string;
	url: string;
	title: SearchResultMarkItem[];
}

export interface UpdateIndexArgs {
	force?: boolean;
	catalogName?: string;
}

function convertPropertyFilter(propertyFilter: PropertyFilter): SearchArticleFilter["metadata"] {
	const op = propertyFilter.op;
	switch (op) {
		case "eq": {
			return {
				op: "eq",
				key: getPropertyKeyName(propertyFilter.key),
				value: propertyFilter.value,
			};
		}

		case "contains": {
			return {
				op: "contains",
				key: getPropertyKeyName(propertyFilter.key),
				list: propertyFilter.list,
			};
		}

		case "isEmpty": {
			return {
				op: "isEmpty",
				key: getPropertyKeyName(propertyFilter.key),
			};
		}

		case "and": {
			return {
				op: "and",
				filters: propertyFilter.filters.map((x) => convertPropertyFilter(x)),
			};
		}

		case "or": {
			return {
				op: "or",
				filters: propertyFilter.filters.map((x) => convertPropertyFilter(x)),
			};
		}

		default:
			throw new Error(`Unexpected property filter operation ${op}`);
	}
}

function getPropertyKeyName(property: string): FieldsToDotPaths<SearchArticleMetadata> {
	return `properties.${property}`;
}
