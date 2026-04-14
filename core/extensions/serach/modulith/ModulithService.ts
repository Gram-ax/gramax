import { CATEGORY_ROOT_FILENAME } from "@app/config/const";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import BaseCatalog from "@core/FileStructue/Catalog/BaseCatalog";
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type { Item } from "@core/FileStructue/Item/Item";
import debounceFunction from "@core-ui/debounceFunction";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import type { PropertyValue } from "@ext/properties/models";
import type { KeyPhraseArticleSearcherItem } from "@ext/serach/modulith/keyPhrase/KeyPhraseArticleSearcher";
import { CombinedProgressManager, type ProgressManager } from "@ext/serach/modulith/ProgressManager";
import { getArticleId, getCatalogId } from "@ext/serach/modulith/parsing/getArticleId";
import type { ResourcesInfo, SearchArticleParser } from "@ext/serach/modulith/parsing/SearchArticleParser";
import type {
	ArticleLanguage,
	SearchArticle,
	SearchArticleCatalogMetadata,
	SearchArticleFileMetadata,
	SearchArticleFilter,
	SearchArticleKey,
} from "@ext/serach/modulith/SearchArticle";
import type {
	SearchResultItem as ClientSearchResultItem,
	ModulithSearchClient,
} from "@ext/serach/modulith/search/ModulithSearchClient";
import type { RemoteModulithSearchClient } from "@ext/serach/modulith/search/RemoteModulithSearchClient";
import { AsyncNotifier } from "@ext/serach/modulith/utils/AsyncNotifier";
import { collectText } from "@ext/serach/modulith/utils/collectText";
import { getLang } from "@ext/serach/modulith/utils/getLang";
import { getValidCatalogItems } from "@ext/serach/modulith/utils/getValidCatalogItems";
import { trimAroundHighlights } from "@ext/serach/modulith/utils/trimAroundHighlights";
import { WorkspaceState } from "@ext/serach/modulith/WorkspaceState";
import type {
	InProgressItem,
	ProgressArgs,
	PropertyFilter,
	ResourceFilter,
	SearcherProgressGenerator,
	SearchResultItem,
	SearchResultMarkItem,
	SearchResultParagraphItem,
} from "@ext/serach/Searcher";
import type { Workspace } from "@ext/workspace/Workspace";
import type { WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";
import type { Article as ModulithArticle } from "@ics/modulith-search-domain/article";
import {
	AggregateProgress,
	andFilter,
	containsFilter,
	eqFilter,
	type Filter,
	inFilter,
	isEmptyFilter,
	notFilter,
	orFilter,
	type ProgressCallback,
} from "@ics/modulith-utils";

export interface ModulithServiceOptions {
	localClient: ModulithSearchClient;
	remoteClient?: RemoteModulithSearchClient;
	wm: WorkspaceManager;
	sap: SearchArticleParser;
	immediateIndexing?: boolean;
}

const PROGRESS_UPDATE_TIMEOUT_MS = 500;

const RESOURCE_ARTICLES_UPDATE_BUFFER_SIZE = 20;

const COMMIT_DEBOUNCE_TIME_MS = 5000;
const COMMIT_DEBOUNCE_SYMBOL = Symbol();
const REQUIRED_COMMIT_DEBOUNCE_TIME_MS = 30 * 1000;
const REQUIRED_COMMIT_DEBOUNCE_SYMBOL = Symbol();

export class ModulithService {
	private _cancelDebounceCommit: (() => void) | undefined;
	private _cancelRequiredCommit: (() => void) | undefined;
	private readonly _stateByWorkspace = new Map<WorkspacePath, WorkspaceState>();

	constructor(private readonly _options: ModulithServiceOptions) {
		// Because of events handling cli and test process unnecessarily hangs
		//   until all events are processed
		// getExecutingEnvironment() returns "next" for test environment
		//   so we need to check global.VITE_ENVIRONMENT instead
		// TODO: refactor event handling
		if (getExecutingEnvironment() === "cli" || global?.VITE_ENVIRONMENT === "test") return;

		_options.wm.onCatalogChange(({ catalog }) => {
			void this._onCatalogChange(catalog);
		});

		_options.wm.onCatalogAdd(({ catalog }) => {
			void this._onCatalogChange(catalog);
		});

		_options.wm.onCatalogRemove(({ name }) => {
			void this._onCatalogRemove(name);
		});

		if (_options.immediateIndexing) {
			void this._readAllCatalogs();
		}
	}

	async updateIndex({ force, catalogName }: UpdateIndexArgs): Promise<void> {
		const curWs = this._options.wm.current();
		const state = this._getOrCreateState(curWs.path());
		const release = await state.lockIndexing();

		try {
			const catalogNames = catalogName
				? [BaseCatalog.parseName(catalogName).name]
				: [...curWs.getAllCatalogs().keys()];
			await this._updateIndexImpl(state, curWs, catalogNames, force !== true);
		} finally {
			release();
		}
	}

	async updateCatalog(catalogName: string, overridePath?: string) {
		const ws = this._options.wm.current();
		const state = this._getOrCreateState(ws.path());
		const catalog = await ws.getContextlessCatalog(BaseCatalog.parseName(catalogName).name);
		await this._actualizeCatalog(state, overridePath ?? state.path, catalog);
	}

	async *progress({ resourceFilter, signal }: ProgressArgs): SearcherProgressGenerator {
		if (signal?.aborted) {
			return;
		}

		const curWs = this._options.wm.current();
		const state = this._getOrCreateState(curWs.path());
		let pms: ProgressManager[] = [];
		switch (resourceFilter) {
			case "without": {
				pms = [state.indexingProgressManager];
				break;
			}
			case "only": {
				pms = [state.resourceIndexingProgressManager];
				break;
			}
			default: {
				pms = [state.indexingProgressManager, state.resourceIndexingProgressManager];
				break;
			}
		}

		const pm = new CombinedProgressManager(pms);
		if (!pm.hasProgresses()) {
			yield {
				type: "done",
			};

			return;
		}

		const notifier = new AsyncNotifier();

		let cur: InProgressItem | undefined = {
			type: "progress",
			progress: pm.getTotalProgress(),
		};

		const handler = (p: number) => {
			cur = { type: "progress", progress: p };
			notifier.notify();
		};

		pm.addProgressSubscriber(handler);

		try {
			while (pm.hasProgresses() || cur !== undefined) {
				if (signal?.aborted) {
					return;
				}

				if (cur !== undefined) {
					const oldCur = cur;
					cur = undefined;
					yield oldCur;
				} else {
					await notifier.waitNext(PROGRESS_UPDATE_TIMEOUT_MS);
				}
			}
		} finally {
			pm.removeProgressSubscriber(handler);
		}

		yield {
			type: "done",
		};
	}

	async searchBatch({ items, signal }: SearchBatchArgs): Promise<SearchResult[][]> {
		const curWs = this._options.wm.current();
		const wsPath = curWs.path();
		const state = this._getOrCreateState(wsPath);

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
				if (catalog != null) {
					catalogs.set(catalogName, catalog);
				}
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

		const searchRes = await this._options.localClient.searchBatch({
			signal,
			items: items.map((x) => {
				const metadataFilters: Filter<SearchArticleKey>[] = [eqFilter(["wsPath"], wsPath)];

				if (x.articleRefPaths) {
					metadataFilters.push(inFilter(["refPath"], x.articleRefPaths));
				}

				if (x.articlesLanguage) {
					metadataFilters.push(eqFilter(["lang"], x.articlesLanguage));
				}

				if (x.propertyFilter) {
					metadataFilters.push(convertPropertyFilter(x.propertyFilter));
				}

				if (x.resourceFilter && x.resourceFilter !== "with") {
					let filter: Filter<SearchArticleKey> = eqFilter(["type"], "file");

					if (x.resourceFilter === "without") {
						filter = notFilter(filter);
					}

					metadataFilters.push(filter);
				}

				return {
					query: x.query,
					filter: {
						metadata: andFilter(metadataFilters),
					},
				};
			}),
		});

		// To prevent unnecessary execution of keyPhraseSearcher
		if (signal?.aborted) return [];

		const keyPhraseRes = items.map((x) => {
			if (!x.query) {
				return [];
			}

			return state.keyPhraseSearcher.search(x.query, (item) => {
				if (item.wsPath !== wsPath) {
					return false;
				}

				if (x.articleRefPaths && !x.articleRefPaths.has(item.article.ref.path.value)) {
					return false;
				}

				return true;
			});
		});

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
			for (let i = 0; i < searchBatch.length; i++) {
				const item = searchBatch[i];

				const catalog = await getCatalog(item.article.metadata.catalogId);
				if (catalog == null) continue;

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
					if (i + 1 > maxSearchResult) {
						continue;
					}

					const article = catalog.findArticle(item.article.metadata.logicPath, []);
					if (article == null) continue;

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
						...(await getArticleOtherFields(catalog, article, item.article.metadata.lang)),
						title: item.title,
						items: processArticleItems(item.items),
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

	async terminate(): Promise<void> {
		await this._flushCommitClient();
		await this._options.localClient.terminate();
		await this._options.sap.terminate();
	}

	private async _onCatalogChange(catalog: ReadonlyCatalog): Promise<void> {
		const ws = this._options.wm.current();
		const state = this._getOrCreateState(ws.path());
		if (this._options.immediateIndexing) {
			const pm = state.indexingProgressManager;
			const rpm = state.resourceIndexingProgressManager;
			const prid = pm.addProgress();
			const rprid = rpm.addProgress();
			try {
				const pc = pm.getProgressCallback(prid);
				const rpc = rpm.getProgressCallback(rprid);
				await this._actualizeCatalog(state, state.path, catalog, pc, rpc);
			} finally {
				pm.doneProgress(prid);
				rpm.doneProgress(rprid);
			}
		} else {
			state.resetIndexedCatalog(catalog.name);
		}
	}

	private async _onCatalogRemove(catalogName: string): Promise<void> {
		const ws = this._options.wm.current();
		const state = this._getOrCreateState(ws.path());
		await this._removeCatalogFromIndex(state, catalogName);
		state.keyPhraseSearcher.removeCatalog(catalogName);
		state.resetIndexedCatalog(catalogName);
	}

	private async _removeCatalogFromIndex(state: WorkspaceState, catalogName: string): Promise<void> {
		const release = await state.lockIndexing();
		try {
			await this._updateBothClients([], {
				metadata: eqFilter(["catalogId"], catalogName),
			});

			this._debounceCommitClient();
		} finally {
			release();
		}
	}

	private async _updateIndexImpl(
		state: WorkspaceState,
		ws: Workspace,
		catalogNames: string[],
		checkIndexed: boolean,
	): Promise<void> {
		const indexingCatalogNames =
			checkIndexed === true ? catalogNames.filter((x) => !state.hasIndexedCatalog(x)) : catalogNames;

		if (indexingCatalogNames.length === 0) {
			return;
		}

		const pm = state.indexingProgressManager;
		const rpm = state.resourceIndexingProgressManager;
		const prid = pm.addProgress();
		const rprid = rpm.addProgress();

		try {
			const pc = pm.getProgressCallback(prid);
			const rpc = rpm.getProgressCallback(rprid);

			const aggProgress = new AggregateProgress({
				progress: {
					count: indexingCatalogNames.length,
				},
				onChange: (p) => {
					pc(p);
				},
			});

			const resourceAggProgress = new AggregateProgress({
				progress: {
					count: indexingCatalogNames.length,
				},
				onChange: (p) => {
					rpc(p);
				},
			});

			await indexingCatalogNames.forEachAsync(
				async (catalogName, i) => {
					const catalog = await ws.getContextlessCatalog(catalogName);
					await this._actualizeCatalog(
						state,
						state.path,
						catalog,
						aggProgress.getProgressCallback(i),
						resourceAggProgress.getProgressCallback(i),
					);
				},
				5,
				true,
			);
		} finally {
			pm.doneProgress(prid);
			rpm.doneProgress(rprid);
		}
	}

	private async _actualizeCatalog(
		state: WorkspaceState,
		wsPath: WorkspacePath,
		catalog?: ReadonlyCatalog,
		progressCallback?: ProgressCallback,
		resourceProgressCallback?: ProgressCallback,
	): Promise<void> {
		try {
			await this._actualizeCatalogImpl(state, wsPath, catalog, progressCallback, resourceProgressCallback);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	private async _actualizeCatalogImpl(
		state: WorkspaceState,
		wsPath: WorkspacePath,
		catalog?: ReadonlyCatalog,
		progressCallback?: ProgressCallback,
		resourceProgressCallback?: ProgressCallback,
	): Promise<void> {
		if (!catalog) {
			progressCallback?.(1);
			resourceProgressCallback?.(1);
			return;
		}

		const aggProgress = new AggregateProgress({
			progress: {
				weights: [5, 95],
			},
			onChange: (p) => progressCallback?.(p),
		});

		await this._updateCatalogSearchArticles(catalog, wsPath, aggProgress.getProgressCallback(0));
		aggProgress.setProgress(0, 1);

		await this._updateSearchArticles(
			state,
			catalog,
			wsPath,
			aggProgress.getProgressCallback(1),
			resourceProgressCallback,
		);
		aggProgress.setProgress(1, 1);

		const catalogArticles = getValidCatalogItems(catalog);
		const currentArticleIds = new Set(catalogArticles.map((x) => `${wsPath}#${x.logicPath}`));
		state.keyPhraseSearcher.removeArticlesNotIn(catalog.name, currentArticleIds);
		catalogArticles.forEach((x) =>
			state.keyPhraseSearcher.updateArticle({
				id: `${wsPath}#${x.logicPath}`,
				wsPath,
				article: x,
				catalog,
			}),
		);

		state.markIndexedCatalog(catalog.name);
	}

	private async _updateCatalogSearchArticles(
		catalog: ReadonlyCatalog,
		wsPath: WorkspacePath,
		progressCallback?: ProgressCallback,
	) {
		const searchArticles: ModulithArticle<SearchArticleCatalogMetadata>[] = [];

		if (catalog.props.title) {
			const lang = catalog.props.language ?? "none";
			searchArticles.push({
				id: getCatalogId(wsPath, catalog.name, lang),
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

		progressCallback?.(0.2);
		if (catalog.props.supportedLanguages?.length) {
			const rootCategoryPath = catalog.getRootCategoryPath();

			for (const supLang of catalog.props.supportedLanguages) {
				if (supLang === catalog.props.language) continue;

				const path = rootCategoryPath.join(new Path(supLang), new Path(CATEGORY_ROOT_FILENAME));

				const langCategory = catalog.findItemByItemPath(path);
				if (!langCategory || !langCategory.props.title) continue;
				searchArticles.push({
					id: getCatalogId(wsPath, catalog.name, supLang),
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

		progressCallback?.(0.5);
		await this._options.localClient.update({
			articles: searchArticles,
			filter: {
				metadata: andFilter<SearchArticleKey>([
					eqFilter(["wsPath"], wsPath),
					eqFilter(["catalogId"], catalog.name),
					eqFilter(["type"], "catalog"),
				]),
			},
		});

		progressCallback?.(1);
		this._debounceCommitClient();
	}

	private async _updateSearchArticles(
		state: WorkspaceState,
		catalog: ReadonlyCatalog,
		wsPath: WorkspacePath,
		progressCallback?: ProgressCallback,
		resourceProgressCallback?: ProgressCallback,
	) {
		const aggProgress = new AggregateProgress({
			progress: {
				weights: [60, 40],
			},
			onChange: (p) => progressCallback?.(p),
		});

		const { searchArticles, resourcesInfo, remoteSearchArticles } = await this._options.sap.getSearchArticles(
			wsPath,
			catalog,
			Boolean(this._options.remoteClient),
			aggProgress.getProgressCallback(0),
		);
		aggProgress.setProgress(0, 1);

		const updateResourceArticlesPromise = this._updateResourceSearchArticles(
			state,
			wsPath,
			catalog,
			resourcesInfo,
			resourceProgressCallback,
		);

		const filter: SearchArticleFilter = {
			metadata: andFilter<SearchArticleKey>([
				eqFilter(["wsPath"], wsPath),
				eqFilter(["catalogId"], catalog.name),
				eqFilter(["type"], "article"),
			]),
		};

		await this._updateBothClients(searchArticles, filter, remoteSearchArticles, aggProgress.getProgressCallback(1));
		aggProgress.setProgress(1, 1);
		this._debounceCommitClient();

		// Remove files from index whose articles are not in catalog
		const currentArticleIds = new Set<string>();
		getValidCatalogItems(catalog).forEach((a) => currentArticleIds.add(getArticleId(wsPath, a.logicPath)));
		await this._options.localClient.update({
			articles: [],
			filter: {
				metadata: andFilter<SearchArticleKey>([
					eqFilter(["wsPath"], wsPath),
					eqFilter(["catalogId"], catalog.name),
					eqFilter(["type"], "file"),
					notFilter(inFilter(["articleId"], currentArticleIds)),
				]),
			},
		});

		await updateResourceArticlesPromise;
	}

	private async _updateResourceSearchArticles(
		state: WorkspaceState,
		wsPath: WorkspacePath,
		catalog: ReadonlyCatalog,
		resourceInfos: ResourcesInfo[],
		progressCallback?: ProgressCallback,
	) {
		const release = await state.lockResourceIndexing(catalog.name);
		try {
			await this._updateResourceSearchArticlesImpl(state, wsPath, catalog, resourceInfos, progressCallback);
		} finally {
			release();
		}
	}

	private async _updateResourceSearchArticlesImpl(
		state: WorkspaceState,
		wsPath: WorkspacePath,
		catalog: ReadonlyCatalog,
		resourceInfos: ResourcesInfo[],
		progressCallback?: ProgressCallback,
	) {
		const aggProgress = new AggregateProgress({
			progress: {
				count: resourceInfos.length,
			},
			onChange: (p) => progressCallback?.(p),
		});

		const articlePayloads =
			resourceInfos.length === 0
				? []
				: await this._options.localClient
						.getArticlePayloads<SearchArticleFileMetadata>({
							items: resourceInfos.map((x) => ({
								filter: {
									metadata: andFilter<SearchArticleKey>([
										eqFilter(["wsPath"], wsPath),
										eqFilter(["catalogId"], catalog.name),
										eqFilter(["type"], "file"),
										eqFilter(["articleId"], getArticleId(wsPath, x.article.logicPath)),
									]),
								},
							})),
						})
						.then((x) => x.articles);

		let bufferSize = 0;
		let articleIdBuffer = new Set<string>();
		const articleBuffer: ModulithArticle<SearchArticleFileMetadata>[] = [];
		let unchangedResourcesBuffer = new Set<string>();

		const flushBuffer = async (progressCallback?: ProgressCallback) => {
			const copyArticleBuffer = [...articleBuffer];
			const copyArticleIdBuffer = articleIdBuffer;
			const copyUnchangedResourcesBuffer = unchangedResourcesBuffer;

			bufferSize = 0;
			articleBuffer.length = 0;
			articleIdBuffer = new Set<string>();
			unchangedResourcesBuffer = new Set<string>();

			await this._options.localClient.update({
				articles: copyArticleBuffer,
				filter: {
					metadata: andFilter<SearchArticleKey>([
						eqFilter(["wsPath"], wsPath),
						eqFilter(["catalogId"], catalog.name),
						eqFilter(["type"], "file"),
						inFilter(["articleId"], copyArticleIdBuffer),
						notFilter(inFilter(["id"], copyUnchangedResourcesBuffer)),
					]),
				},
				progressCallback: progressCallback,
			});

			this._debounceCommitClient();
		};

		await resourceInfos.forEachAsync(
			async (x, i) => {
				const resAggProgress = new AggregateProgress({
					progress: {
						weights: [50, 50],
					},
					onChange: (p) => aggProgress.setProgress(i, p),
				});

				const articleId = getArticleId(wsPath, x.article.logicPath);

				const payloads = articlePayloads[i];
				const { searchArticles, unchangedResources } = await this._options.sap.parseResourceArticles(
					x.resources,
					x.parsedContent.parsedContext.getResourceManager(),
					wsPath,
					x.article,
					catalog,
					x.properties,
					payloads,
					state.resourceParsingLock,
					resAggProgress.getProgressCallback(0),
				);
				resAggProgress.setProgress(0, 1);

				bufferSize++;
				articleIdBuffer.add(articleId);
				articleBuffer.push(...searchArticles);
				unchangedResources.forEach((x) => unchangedResourcesBuffer.add(x));

				if (bufferSize >= RESOURCE_ARTICLES_UPDATE_BUFFER_SIZE) {
					await flushBuffer(resAggProgress.getProgressCallback(1));
				}

				resAggProgress.setProgress(1, 1);
			},
			20,
			true,
		);

		if (bufferSize > 0) {
			await flushBuffer();
		}

		progressCallback?.(1);
	}

	private async _updateBothClients(
		articles: SearchArticle[],
		filter: SearchArticleFilter,
		remoteArticles?: SearchArticle[],
		progressCallback?: ProgressCallback,
	) {
		const aggProgress = new AggregateProgress({
			progress: {
				weights: this._options.remoteClient ? [50, 50] : [100],
			},
			onChange: (p) => progressCallback?.(p),
		});

		await Promise.allSettled([
			this._options.localClient.update({
				articles,
				filter,
				progressCallback: aggProgress.getProgressCallback(0),
			}),
			this._options.remoteClient?.update({
				articles: remoteArticles ?? articles,
				filter,
				progressCallback: aggProgress.getProgressCallback(1),
			}),
		]);

		aggProgress.setProgress(0, 1);
		if (this._options.remoteClient) {
			aggProgress.setProgress(1, 1);
		}
	}

	private _debounceCommitClient() {
		// Committing saves data in storage
		// If storage is slow, we dont want to commit too often
		this._cancelDebounceCommit = debounceFunction(
			COMMIT_DEBOUNCE_SYMBOL,
			() => this._flushCommitClient(),
			COMMIT_DEBOUNCE_TIME_MS,
		);

		// With this we can commit periodically
		// In case of many frequent updates
		if (this._cancelRequiredCommit == null) {
			this._cancelRequiredCommit = debounceFunction(
				REQUIRED_COMMIT_DEBOUNCE_SYMBOL,
				() => this._flushCommitClient(),
				REQUIRED_COMMIT_DEBOUNCE_TIME_MS,
			);
		}
	}

	private async _flushCommitClient() {
		this._cancelDebounceCommit?.();
		this._cancelDebounceCommit = undefined;
		this._cancelRequiredCommit?.();
		this._cancelRequiredCommit = undefined;
		await this._options.localClient.commit();
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
		articleRefPaths?: Set<string>;
		propertyFilter?: PropertyFilter;
		resourceFilter?: ResourceFilter;
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

function convertPropertyFilter(propertyFilter: PropertyFilter): Filter<SearchArticleKey> {
	const op = propertyFilter.op;
	switch (op) {
		case "eq": {
			return eqFilter(getPropertyKeyName(propertyFilter.key), propertyFilter.value);
		}
		case "contains": {
			return containsFilter(getPropertyKeyName(propertyFilter.key), propertyFilter.list);
		}
		case "isEmpty": {
			return isEmptyFilter(getPropertyKeyName(propertyFilter.key));
		}
		case "and": {
			return andFilter(propertyFilter.filters.map((x) => convertPropertyFilter(x)));
		}
		case "or": {
			return orFilter(propertyFilter.filters.map((x) => convertPropertyFilter(x)));
		}
		default:
			throw new Error(`Unexpected property filter operation ${op}`);
	}
}

function getPropertyKeyName(property: string): SearchArticleKey {
	return ["properties", property];
}

function processArticleItems(items: ClientSearchResultItem[]): SearchResultItem[] {
	items.forEach((x) => {
		const type = x.type;
		switch (type) {
			case "paragraph": {
				(x as SearchResultParagraphItem).searchText = collectText(x.items);
				x.items = trimAroundHighlights(x.items);
				break;
			}
			case "block": {
				processArticleItems(x.items);
				break;
			}
			default:
				throw new Error(`Unexpected article item type ${type}`);
		}
	});

	return items as SearchResultItem[];
}
