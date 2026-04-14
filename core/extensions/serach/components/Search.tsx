import { TextSize } from "@components/Atoms/Button/Button";
import Checkbox from "@components/Atoms/Checkbox";
import Icon from "@components/Atoms/Icon";
import Input from "@components/Atoms/Input";
import Anchor, { type AnchorProps } from "@components/controls/Anchor";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ButtonLink from "@components/Molecules/ButtonLink";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import generateUniqueID from "@core/utils/generateUniqueID";
import { type NDJsonReadStream, readNDJson } from "@core/utils/readNDJson";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SearchQueryService from "@core-ui/ContextServices/SearchQuery";
import { useDebounceValue } from "@core-ui/hooks/useDebounceValue";
import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import getArticleItemLink from "@ext/article/LinkCreator/logic/getArticleItemLink";
import t from "@ext/localization/locale/translate";
import SimpleMarkdownParser from "@ext/markdown/core/Parser/SimpleMarkdownParser";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import type { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { type Property, PropertyTypes } from "@ext/properties/models";
import { FilteredPropertyBlock } from "@ext/serach/components/FilteredPropertyBlock";
import { IndexingProgress } from "@ext/serach/components/IndexingProgress";
import { PropertyFilter as PropertyFilterComponent } from "@ext/serach/components/PropertyFilter";
import { ResourceFilterDropdown } from "@ext/serach/components/ResourceFilterDropdown";
import { type ScopeFilter, ScopeFilterDropdown } from "@ext/serach/components/ScopeFilterDropdown";
import { SearchResults } from "@ext/serach/components/SearchResults";
import { usePropertyFilter } from "@ext/serach/components/usePropertyFilter";
import { chatStream } from "@ext/serach/components/utils/chatStream";
import { getSearchData } from "@ext/serach/components/utils/getSearchData";
import type { SearchFragmentInfo } from "@ext/serach/utils/ArticleFragmentCounter/ArticleFragmentCounter";
import type { FocusItem } from "@ext/serach/utils/FocusItemsCollector";
import { emitPluginEvent } from "@plugins/api/events";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	highlightFragmentInDocportal,
	highlightFragmentInEditor,
} from "../../../components/Article/SearchHandler/ArticleSearchFragmentHander";
import type { ProgressItem, PropertyFilter } from "../Searcher";
import chatCitations from "../utils/chatCitations/chatCitations";
import type { RowSearchResult } from "../utils/SearchRowsModel";

const DEBOUNCE_DELAY = 400;
const CHAT_DEBOUNCE_DELAY = DEBOUNCE_DELAY * 2;
const parser = new SimpleMarkdownParser();

export interface SearchProps {
	isHomePage: boolean;
	itemLinks?: ItemLink[];
	className?: string;
}

type SearchComponentData =
	| { type: "search"; rows: RowSearchResult[] }
	| {
			type: "chat";
			chatData: RenderableTreeNodes;
	  };

function execLoadData(
	setData: (data: SearchComponentData | null) => void,
	abortControllerRef: MutableRefObject<AbortController>,
	loadData: (query: string, signal: AbortSignal) => Promise<void>,
	query: string,
) {
	setData(null);
	const controller = new AbortController();
	abortControllerRef.current?.abort();
	abortControllerRef.current = controller;
	loadData(query, controller.signal);
	return controller;
}

const nextScopeFilter: Record<ScopeFilter, ScopeFilter> = {
	all: "catalog",
	catalog: "article",
	article: "all",
};

const Search = (props: SearchProps) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { isHomePage, itemLinks, className } = props;
	const isMac = IsMacService.value;
	const {
		query,
		resourceFilter,
		setQuery,
		setResourceFilter,
		hasOpenRequest,
		openRequestVersion,
		requestedScopeFilter,
		clearOpenRequest,
	} = SearchQueryService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { properties: catalogProperties } = PropertyServiceProvider.value;
	const { catalogName, catalogDefaultLanguage } = useCatalogPropsStore(
		(state) => ({
			catalogName: state.data?.name,
			catalogDefaultLanguage: state.data?.language,
		}),
		"shallow",
	);
	const currentArticleLanguage = PageDataContextService.value?.language?.content;
	const isReadOnly = PageDataContextService.value?.conf?.isReadOnly;

	const { isNext, isStatic, isBrowser, isTauri } = usePlatform();
	const vectorSearchEnabled = (isNext && PageDataContextService.value?.conf?.ai?.enabled) ?? false;
	const isCatalogExist = !!catalogName;

	const narrowMedia = useMediaQuery(cssMedia.JSnarrow);
	const blockRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const responseRef = useRef<HTMLDivElement>(null);
	const resultsKeyHandlerRef = useRef<((e: React.KeyboardEvent) => boolean) | undefined>(undefined);
	const abortControllerRef = useRef<AbortController>(new AbortController());
	const handledOpenRequestVersionRef = useRef<number>(0);
	const pendingOpenScopeRef = useRef<ScopeFilter | undefined>(undefined);

	const [isOpen, setIsOpen] = useState(false);
	const [focusItem, setFocusItem] = useState<FocusItem | undefined>(undefined);
	// biome-ignore lint/style/useNamingConvention: idc
	const [data, _setData] = useState<SearchComponentData | null>(null);
	const [chatSearch, setChatSearch] = useState(false);
	// biome-ignore lint/style/useNamingConvention: idc
	const [scopeFilter, _setScopeFilter] = useState<ScopeFilter>(isHomePage ? "all" : "catalog");

	// Wrap query into an object so debounce triggers even if the value
	//   changes and then reverts back before the debounce delay
	// Without this, q1 -> q2 -> q1 won't trigger a re-render
	//   because React sees the value as unchanged
	const queryObj = useMemo(() => ({ query }), [query]);

	const queryDebounce = useDebounceValue(queryObj, chatSearch ? CHAT_DEBOUNCE_DELAY : DEBOUNCE_DELAY);
	const debouncedQueryObj = queryDebounce.value;
	const cancelQueryDebounce = queryDebounce.cancel;

	// Search analytics state
	const searchSessionId = useRef<string | null>(null);
	const currentSearchAnalyticsId = useRef<number | null>(null);

	const [indexProgress, setIndexProgress] = useState<number>(1);
	const indexing = indexProgress !== 1;

	const {
		filteredProperties,
		filterableProperties,
		shownFilterableProperties,
		togglePropertyValue,
		clearFilteredProperty,
		clearFilteredProperties,
	} = usePropertyFilter({
		isReadOnlyPlatform: isReadOnly,
		properties: catalogProperties,
	});

	const setData: typeof _setData = useCallback((v) => {
		setFocusItem(undefined);
		_setData(v);
	}, []);

	const setScopeFilter = useCallback(
		(v: ScopeFilter) => {
			if (v === scopeFilter) return;

			setData(null);
			_setScopeFilter(v);
		},
		[scopeFilter, setData],
	);

	const canUsePropertyFilter = scopeFilter !== "all" && !chatSearch;
	const hasPropertyFilter = canUsePropertyFilter && filteredProperties.length !== 0;
	const emptyInput = !query && !hasPropertyFilter;
	const initiateIndexingOnOpen = isBrowser || isTauri;
	const articlesLanguage =
		isCatalogExist && scopeFilter !== "all"
			? (currentArticleLanguage ?? catalogDefaultLanguage ?? "none")
			: undefined;

	const currentPathname = ArticlePropsService.value?.pathname;
	const currentArticleRefPath = ArticlePropsService.value?.ref.path;
	const currentIsCategory =
		(itemLinks ? getArticleItemLink(itemLinks, currentArticleRefPath) : undefined)?.type === ItemType.category;

	const isResourcesSearchEnabled = PageDataContextService.value?.conf?.search?.resourcesEnabled && !chatSearch;

	const onLinkOpen = useCallback(
		(articleInfo: { url: string; searchFragmentInfo?: SearchFragmentInfo }) => {
			if (currentSearchAnalyticsId.current) {
				emitPluginEvent("search:click", {
					searchAnalyticsId: currentSearchAnalyticsId.current,
					articleUrl: articleInfo.url,
				});
				currentSearchAnalyticsId.current = null;
			}

			setIsOpen(false);
			if (!isHomePage && articleInfo.url === currentPathname && articleInfo.searchFragmentInfo) {
				if (isBrowser || isTauri)
					highlightFragmentInEditor(
						articleInfo.searchFragmentInfo.text,
						articleInfo.searchFragmentInfo.indexInArticle,
					);
				else if (isStatic)
					highlightFragmentInDocportal(
						articleInfo.searchFragmentInfo.text,
						articleInfo.searchFragmentInfo.indexInArticle,
					);
			}
		},
		[isHomePage, currentPathname, isBrowser, isTauri, isStatic],
	);

	const ChatLink = useCallback(
		(props: AnchorProps) => {
			return <Anchor {...props} onClick={() => onLinkOpen({ url: props.href })} />;
		},
		[onLinkOpen],
	);

	const keydownHandler = (e: KeyboardEvent) => {
		if (e.code === "Slash" && (e.ctrlKey || e.metaKey)) {
			setIsOpen((prev) => !prev);
			return;
		}
		if (!isHomePage && e.code === "Enter" && (e.ctrlKey || e.metaKey)) {
			setScopeFilter(nextScopeFilter[scopeFilter]);
			return;
		}
	};
	const handleProgressResponse = useCallback(async (stream: NDJsonReadStream, signal: AbortSignal) => {
		const itemGenerator = readNDJson<ProgressItem>(stream, signal);

		for await (const item of itemGenerator) {
			const type = item.type;
			switch (type) {
				case "progress":
					setIndexProgress(item.progress);
					break;
				case "done":
					setIndexProgress(1);
					break;
				default:
					throw new Error(`Unexpected task stream item type ${type}`);
			}
		}
	}, []);

	const updateIndex = useCallback(async () => {
		await FetchService.fetch<unknown>(
			apiUrlCreator.getResetSearchDataUrl(scopeFilter !== "all" ? catalogName : undefined),
		);
	}, [apiUrlCreator, catalogName, scopeFilter]);

	const loadIndexProgress = useCallback(
		async (signal: AbortSignal) => {
			try {
				const res = await FetchService.fetch<unknown>(
					apiUrlCreator.getIndexingProgressUrl(resourceFilter),
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					signal,
				);
				if (!res.ok) return;
				await handleProgressResponse(res.body.getReader(), signal);
			} catch (error) {
				if (!(error instanceof DOMException && error.name === "AbortError")) {
					throw error;
				}
			}
		},
		[apiUrlCreator, handleProgressResponse, resourceFilter],
	);

	const onClose = useCallback(() => {
		searchSessionId.current = null;
		currentSearchAnalyticsId.current = null;
		abortControllerRef.current?.abort();
		abortControllerRef.current = undefined;
		setFocusItem(undefined);
		setIsOpen(false);
	}, []);

	useEffect(() => {
		const controller = new AbortController();
		if (!initiateIndexingOnOpen || !isOpen) return;
		updateIndex();
		loadIndexProgress(controller.signal);

		return () => {
			controller.abort();
		};
	}, [initiateIndexingOnOpen, isOpen, updateIndex, loadIndexProgress]);

	useEffect(() => {
		if (isOpen) {
			const controller = new AbortController();
			loadIndexProgress(controller.signal);
			return () => {
				controller.abort();
			};
		}
	}, [isOpen, loadIndexProgress]);

	useEffect(() => {
		document.addEventListener("keydown", keydownHandler, false);
		return () => {
			document.removeEventListener("keydown", keydownHandler, false);
		};
	});

	let searchParamsChanged = false;
	// biome-ignore lint/correctness/useExhaustiveDependencies(searchParamsChanged): always false, never triggers useMemo
	const loadData = useMemo(() => {
		searchParamsChanged = true;

		return async (query: string, signal: AbortSignal) => {
			if (!query && !hasPropertyFilter) {
				return;
			}

			try {
				const urlCatalogName = scopeFilter !== "all" ? catalogName : undefined;

				if (chatSearch) {
					const responseLanguage = isCatalogExist
						? (currentArticleLanguage ?? catalogDefaultLanguage)
						: undefined;

					let chatResponseBuffer = "";
					await chatStream({
						url: apiUrlCreator.getSearchChatUrl(query, urlCatalogName, articlesLanguage, responseLanguage),
						query,
						onData: async (data) => {
							chatResponseBuffer += data;
							const chatDataRaw = await parser.parse(chatResponseBuffer);
							const chatData = chatCitations(chatDataRaw);

							setData({
								type: "chat",
								chatData,
							});
						},
						signal,
					});
				} else {
					const propertyFilter = !canUsePropertyFilter
						? undefined
						: buildPropertyFilter(filteredProperties, catalogProperties);

					const rows = await getSearchData({
						url: apiUrlCreator.getSearchDataUrl(query, urlCatalogName, undefined, articlesLanguage),
						onlyArticles: scopeFilter !== "all",
						signal,
						resourceFilter: isResourcesSearchEnabled ? resourceFilter : undefined,
						propertyFilter,
						articleRefPath: scopeFilter === "article" ? currentArticleRefPath : undefined,
					});

					if (rows) {
						setData({
							type: "search",
							rows,
						});

						trackSearchMetric(query, searchSessionId.current, currentSearchAnalyticsId, rows);
					}
				}
			} catch (e) {
				if (!(e instanceof DOMException && e.name === "AbortError")) {
					console.error(e);
				}
			}
		};
	}, [
		apiUrlCreator,
		canUsePropertyFilter,
		articlesLanguage,
		isCatalogExist,
		currentArticleLanguage,
		catalogDefaultLanguage,
		catalogName,
		setData,
		scopeFilter,
		resourceFilter,
		chatSearch,
		filteredProperties,
		catalogProperties,
		hasPropertyFilter,
		isResourcesSearchEnabled,
		currentArticleRefPath,
	]);

	if (searchParamsChanged) {
		cancelQueryDebounce();
		debouncedQueryObj.query = query;
	}

	useEffect(() => {
		void queryObj;
		void loadData;
		abortControllerRef.current?.abort();
		abortControllerRef.current = undefined;
	}, [queryObj, loadData]);

	const handleModalOpen = useCallback(() => {
		const scope = pendingOpenScopeRef.current;
		pendingOpenScopeRef.current = undefined;
		const changingScope = Boolean(scope) && !isHomePage;

		// On home page we keep home scope behavior and ignore external scope overrides
		if (changingScope) {
			_setScopeFilter(scope as ScopeFilter);
		}

		const sessionId = generateUniqueID(10);
		searchSessionId.current = sessionId;
		setIsOpen(true);
		if (data == null || changingScope) {
			execLoadData(setData, abortControllerRef, loadData, query);
		}
		if (inputRef.current && query) {
			inputRef.current.value = query;
			inputRef.current.select();
		}
	}, [data, isHomePage, loadData, query, setData]);

	useEffect(() => {
		if (!hasOpenRequest) return;
		if (openRequestVersion === 0 || handledOpenRequestVersionRef.current === openRequestVersion) return;
		handledOpenRequestVersionRef.current = openRequestVersion;
		pendingOpenScopeRef.current = requestedScopeFilter;
		setIsOpen(true);
		clearOpenRequest();
	}, [hasOpenRequest, openRequestVersion, requestedScopeFilter, clearOpenRequest]);

	// biome-ignore lint/correctness/useExhaustiveDependencies(isOpen): idc
	useEffect(() => {
		if (!isOpen) return;

		const query = debouncedQueryObj.query;
		const controller = execLoadData(setData, abortControllerRef, loadData, query);
		return () => {
			controller.abort();
		};
	}, [debouncedQueryObj, setData, loadData]);

	const onInputKeyDown = (e: React.KeyboardEvent) => {
		if (e.ctrlKey) return;

		if (resultsKeyHandlerRef.current?.(e)) {
			e.preventDefault();
		}
	};

	const registerKeyHandler = useCallback((fn: typeof resultsKeyHandlerRef.current) => {
		resultsKeyHandlerRef.current = fn;
	}, []);

	return (
		<ModalLayout
			contentWidth={"minM"}
			isOpen={isOpen}
			onClose={onClose}
			onOpen={handleModalOpen}
			trigger={
				isHomePage ? (
					<div>
						<Tooltip>
							<TooltipContent>
								<p>{t("search.name")}</p>
							</TooltipContent>
							<TooltipTrigger asChild>
								<IconButton
									className="p-2"
									icon={"search"}
									iconClassName="w-5 h-5 stroke-[1.6]"
									size="lg"
									variant="ghost"
								/>
							</TooltipTrigger>
						</Tooltip>
					</div>
				) : (
					<ButtonLink iconCode="search" textSize={TextSize.L} />
				)
			}
		>
			<div data-qa={`search-modal`} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
				<div className={`${className} modal`} ref={blockRef}>
					<ModalLayoutLight className="layer-two block-elevation-2">
						<div className="search-form form block-elevation-3">
							<div className="search-input-block">
								<div className="search-input">
									{/** biome-ignore lint/a11y/useValidAnchor: TODO: fix */}
									<a className="search-icon" style={{ cursor: "auto" }}>
										<Icon code={"search"} />
									</a>
									<Input
										data-qa={t("search.placeholder")}
										onChange={(e) => {
											const query = e.target.value;
											setQuery(query);
											setData(null);
										}}
										onKeyDown={onInputKeyDown}
										placeholder={t("search.placeholder")}
										ref={inputRef}
										type="text"
										value={query}
									/>
									<div className="search-input-right-side">
										{canUsePropertyFilter && filterableProperties.array.length > 0 && (
											<PropertyFilterComponent
												filteredProperties={filteredProperties}
												properties={shownFilterableProperties.array}
												togglePropertyValue={togglePropertyValue}
											/>
										)}
										{!emptyInput && (
											<button
												className="search-icon"
												onClick={() => {
													setQuery("");
													setData(null);
													clearFilteredProperties();
													inputRef.current?.focus();
												}}
												type="button"
											>
												<Icon code={"x"} />
											</button>
										)}
									</div>
								</div>
							</div>
							{indexing && <IndexingProgress progress={indexProgress} />}
							{canUsePropertyFilter && (
								<FilteredPropertyBlock
									catalogProperties={catalogProperties}
									clearFilteredProperty={clearFilteredProperty}
									properties={filteredProperties}
									togglePropertyValue={togglePropertyValue}
								/>
							)}
						</div>

						<div className="response" ref={responseRef}>
							{emptyInput && !data ? (
								<>
									<div className="msg tip">
										<div className="article">
											<p
												dangerouslySetInnerHTML={{
													// biome-ignore lint/style/useNamingConvention: idc
													__html: t("search.desc"),
												}}
											/>
										</div>
									</div>
								</>
							) : (
								<>
									{!data ? (
										<div className="msg loading">
											<Icon isLoading style={{ marginRight: "var(--distance-i-span)" }} />
											<span>{t("loading")}</span>
										</div>
									) : data.type === "search" && !data.rows.length ? (
										<div className="msg empty">
											<Icon code="circle-slash-2" />
											<span>{t("search.articles-not-found")}</span>
										</div>
									) : (
										<div>
											{data.type === "chat" ? (
												<div className="item">
													<div style={{ overflow: "hidden" }}>
														<div className="chat-title" data-qa="qa-clickable">
															<div>
																<span>✨</span>
															</div>
														</div>

														<div className="excerpt chat-result">
															<div style={{ whiteSpace: "pre-wrap" }}>
																{!data.chatData ? (
																	t("app.error.command-failed.title")
																) : (
																	<div
																		className="article"
																		style={{ background: "none" }}
																	>
																		<div className="main-article">
																			<div className="article-body">
																				{Renderer(data.chatData, {
																					components: {
																						...getComponents(),
																						ChatLink,
																					},
																				})}
																			</div>
																		</div>
																	</div>
																)}
															</div>
														</div>
													</div>
												</div>
											) : (
												<SearchResults
													containerRef={responseRef}
													currentRefPath={currentArticleRefPath}
													focusItem={focusItem}
													onLinkOpen={onLinkOpen}
													registerKeyHandler={registerKeyHandler}
													rows={data.rows}
													setFocusItem={setFocusItem}
													showCatalogBreadcrumb={scopeFilter === "all"}
												/>
											)}
										</div>
									)}
								</>
							)}
						</div>
					</ModalLayoutLight>
					<div className="bottom-content">
						<div className="absolute-bg " />
						<div className="bottom-content-content prompt article">
							{!isHomePage && isCatalogExist && (
								<div className="bottomCheckbox">
									<div className={"text"}>
										<span className="cmd">{isMac ? <Icon code="command" /> : "Ctrl"}</span>
										<p>+</p>
										<span className="cmd">
											<Icon code="corner-down-left" />
										</span>
									</div>
								</div>
							)}
							{vectorSearchEnabled && (
								<div className="bottomCheckbox">
									<Checkbox
										checked={chatSearch}
										className="chat-search-checkbox"
										onChange={(isChecked) => {
											setChatSearch(isChecked);
										}}
									>
										<p>{t("search.ai")}</p>
									</Checkbox>
								</div>
							)}
							{!isHomePage && (
								<ScopeFilterDropdown
									isCategory={currentIsCategory}
									scopeFilter={scopeFilter}
									setScopeFilter={setScopeFilter}
								/>
							)}
							{isResourcesSearchEnabled && (
								<ResourceFilterDropdown
									resourceFilter={resourceFilter}
									setResourceFilter={setResourceFilter}
								/>
							)}
							{!narrowMedia && (
								<>
									<div className={"text"}>
										<span className="cmd">
											<Icon code="arrow-down" />
										</span>
										<span className="cmd">
											<Icon code="arrow-up" />
										</span>
										<span className="cmd">
											<Icon code="corner-down-left" />
										</span>
										<p>{t("to-navigate")}</p>
									</div>
									<div className={"text"}>
										<span className="cmd">Esc</span>
										<p>{t("close")}</p>
									</div>
								</>
							)}

							{!narrowMedia && (
								<div
									className={"text"}
									style={{
										flex: 1,
										display: "flex",
										justifyContent: "flex-end",
									}}
								>
									<span className="cmd">{isMac ? <Icon code="command" /> : "Ctrl"}</span>+
									<span className="cmd">/</span>
									<p>{t("search.open")}</p>
								</div>
							)}
						</div>
					</div>
				</div>
				<div onClick={onClose} style={{ height: "100%" }}></div>
			</div>
		</ModalLayout>
	);
};

export default styled(Search)`
  transition: all 0.3s;
  max-height: 100%;

  .layer-two {
    overflow: hidden;

    .search-form {
      padding: 0;

      .search-input-block {
        padding: 1rem;
        .search-input {
          width: 100%;
          display: flex;
          height: 1.5rem;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: var(--distance-i-span);
          border-radius: var(--radius-small);

          .search-input-right-side {
            display: flex;
            align-items: inherit;
            gap: 1em;
          }

          input {
            width: 100%;
            height: 100%;
            border: none;
            outline: 0;
            font-size: 1rem;
            color: var(--color-primary);
            background: var(--color-article-bg);
          }

          .search-icon {
            height: 100%;
            display: flex;
            line-height: 100%;
            align-items: center;

            i {
              font-size: var(--big-icon-size);
            }
          }

          .search-icon:hover {
            text-decoration: none !important;
          }
        }
      }

      .search-form-divider {
        border-top: 1px solid var(--color-merge-request-border);
      }

      .search-form-indexing-progress {
        padding: 0.5rem 1rem;
        width: 100%;
      }

      .search-form-properties-block {
        padding: 0.5rem;
      }
    }

    .response {
      width: 100%;
      overflow-y: auto;
      border-radius: var(--radius-small);

      .msg {
        margin: 2em 20px;
        text-align: center;

        &.empty,
        &.loading {
          height: 32px;
          width: auto;
          opacity: 0.5;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .msg.tip {
        text-align: left;
        margin: 0 1rem 1rem 1rem !important;

        p {
          font-size: 0.9em;
        }

        .article {
          opacity: 0.6;
          background: var(--color-contextmenu-bg);
        }
      }

      .item {
        display: block;
        line-height: 1.2em;
        padding: 15px 1rem;
        outline: none !important;
        text-decoration: none !important;
        color: var(--color-primary);

        background: var(--color-contextmenu-bg);

        .breadcrumb {
          align-items: baseline;
        }

        .chat-title {
          gap: 0.5rem;
          display: flex;
          font-weight: 400;
          align-items: center;
          margin-bottom: 0.3em;
        }

        .item-title {
          padding: 3px 0;
          cursor: pointer;

          .item-title-badges {
            float: right;
            display: flex;
            gap: 0.3em;
            white-space: nowrap;
            margin-left: 1rem;

            .item-title-badge {
              box-shadow: none;
              font-weight: 400;
              border: none;
            }

            .item-title-badge-current {
              background-color: var(--search-badge-current-bg);
              color: var(--search-badge-current-text);
            }

            .item-title-badge-recommended {
              background-color: var(--search-badge-recommended-bg);
              color: var(--search-badge-recommended-text);
            }
          }

          .item-title-content {
            display: flex;
            flex-wrap: wrap;
            font-weight: 400;
            row-gap: 0.3em;
            align-items: baseline;
            gap: 1.5rem;
            flex-wrap: wrap;
            row-gap: 0.3em;
            min-width: 0;

            .article-breadcrumb {
              margin-top: 0;
            }

            .breadcrumb-catalog {
              color: var(--color-breadcrumb-catalog-text);

              &:hover {
                color: var(--color-primary);
              }
            }
          }
        }

        .item-title-text {
          word-break: break-all;
        }

        .excerpt {
          font-size: 14px;
          font-weight: 300;
          padding: 3px 0;

          .cut-content {
            white-space: normal;
            display: block;
            width: 100%;
          }
        }

				.hidden-count-info {
					font-size: 12px;
					cursor: pointer;
				}

        .article-header {
          display: flex;
          align-items: baseline;
          font-size: 12px;
          font-weight: 400;

          .breadcrumbs-separator {
            padding: 0 0.26rem;
          }
        }

        .match {
          font-weight: inherit;
          font-size: inherit;
          line-height: inherit;
          background: var(--search-fragment-highlight-bg);
        }

        .count {
          float: right;
          opacity: 0.4;
          font-size: 0.8em;
        }

        .file-block-title {
          display: flex;
          align-items: baseline;
          gap: 0.3rem;

          span.gr-file {
            display: flex;
            color: var(--color-link);

            &::before {
              content: var(--content-file-plus);
              vertical-align: text-bottom;
              line-height: 1;
              padding-right: 0.3rem;
            }

            .gr-file-title {
              align-self: baseline;
            }
          }

          .file-true-name {
            color: var(--color-primary-general);
          }
        }
      }

      .item-active {
        text-decoration: none;
        background-color: var(--color-article-bg);
      }
    }
  }

  .indexing-info {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.3rem;
    padding-bottom: 0.3rem;
    font-size: 0.9em;

    .indexing-info-text {
      white-space: nowrap;
    }
  }

  .indexing-info {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.3rem;
    padding-bottom: 0.3rem;
    font-size: 0.9em;

    .indexing-info-text {
      white-space: nowrap;
    }
  }

	.bottom-content-content {
		height: 17px;

		.bottom-content-filter-dropdown-trigger {
			width: auto;
			height: 100%;
			font-size: 10px;
			font-weight: 400;
			padding-left: 0rem;
			padding-right: 0rem;
		}
	}

  .prompt {
    display: flex;
    gap: 1rem;
    width: 100%;
    background: var(--color-menu-bg);
    font-size: 10px;
    flex-direction: row;
    align-items: baseline;
    position: relative;

    p {
      margin-bottom: 0;
      line-height: 100%;
    }

    .text {
      gap: 0.3rem;
      display: flex;
      line-height: 100%;
      align-items: baseline;

      .text {
        gap: 0.1rem;
      }

      .cmd {
        font-weight: 300;
        padding: 2px 2px !important;
        font-style: normal !important;
        background: var(--color-search-code);
      }
    }

    .bottomCheckbox {
      gap: 0.3rem;
      display: flex;
      align-items: center;
      align-self: center;

      .text {
        gap: 0.1rem;
      }
    }
  }

  ${cssMedia.mediumest} {
    .cut-content {
      display: inline !important;
      white-space: normal !important;
    }
  }
`;

function buildPropertyFilter(
	filteredProperties: Property[],
	catalogProperties: Map<string, Property>,
): PropertyFilter | undefined {
	if (filteredProperties.length === 0) {
		return undefined;
	}

	return {
		op: "and",
		filters: filteredProperties.map<PropertyFilter>((x) => {
			const catalogProperty = catalogProperties.get(x.name);
			if (catalogProperty !== undefined && catalogProperty.type === PropertyTypes.flag) {
				return {
					op: "or",
					// TODO: Hack. Should go away when switch to FilterMenu
					filters: x.value.map<PropertyFilter>((y) =>
						y === t("yes")
							? {
									op: "eq",
									key: x.name,
									value: true,
								}
							: {
									op: "isEmpty",
									key: x.name,
								},
					),
				};
			}

			return {
				op: "contains",
				key: x.name,
				list: x.value,
			};
		}),
	};
}

function trackSearchMetric(
	query: string,
	searchSessionId: string,
	currentSearchAnalyticsId: MutableRefObject<number>,
	rows: RowSearchResult[],
) {
	if (!query || !searchSessionId) return;

	// Track search start with analytics
	emitPluginEvent("search:start", {
		query,
		searchSessionId,
		onSuccess: (searchAnalyticsId: number) => {
			currentSearchAnalyticsId.current = searchAnalyticsId;
			const results = rows.map((row, index) => ({
				url: row.rawResult.url,
				title: row.rawResult.title.map((t) => t.text).join(""),
				catalog: row.type === "article" ? row.rawResult.catalog?.title : undefined,
				type: row.type,
				position: index + 1,
				isRecommended: row.type === "article" ? row.rawResult.isRecommended : false,
			}));

			emitPluginEvent("search:results", {
				searchAnalyticsId,
				results,
			});
		},
	});
}
