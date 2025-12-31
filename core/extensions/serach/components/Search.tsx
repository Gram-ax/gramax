import { ResponseStreamItem } from "@app/commands/search/chat";
import { TextSize } from "@components/Atoms/Button/Button";
import Checkbox from "@components/Atoms/Checkbox";
import Icon from "@components/Atoms/Icon";
import Input from "@components/Atoms/Input";
import Link from "@components/Atoms/Link";
import LinksBreadcrumb, { LinksBreadcrumbProps } from "@components/Breadcrumbs/LinksBreadcrumb";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import Url from "@core-ui/ApiServices/Types/Url";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SearchQueryService from "@core-ui/ContextServices/SearchQuery";
import debounceFunction from "@core-ui/debounceFunction";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { useRouter } from "@core/Api/useRouter";
import { NDJsonReadStream, readNDJson } from "@core/utils/readNDJson";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import SimpleMarkdownParser from "@ext/markdown/core/Parser/SimpleMarkdownParser";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import { ArticlePropertyWrapper } from "@ext/properties/components/ArticlePropertyWrapper";
import PropertyComponent from "@ext/properties/components/Property";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { PropertyTypes } from "@ext/properties/models";
import BreadcrumbCatalog from "@ext/serach/components/BreadcrumbCatalog";
import { CatalogResultItem } from "@ext/serach/components/CatalogResultItem";
import { FilteredPropertyBlock } from "@ext/serach/components/FilteredPropertyBlock";
import { IndexingProgress } from "@ext/serach/components/IndexingProgress";
import { PropertyFilter as PropertyFilterComponent } from "@ext/serach/components/PropertyFilter";
import { usePropertyFilter } from "@ext/serach/components/usePropertyFilter";
import { SearchFragmentInfo } from "@ext/serach/utils/ArticleFragmentCounter/ArticleFragmentCounter";
import { useMediaQuery } from "@react-hook/media-query";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ProgressItem, PropertyFilter, SearchResult } from "../Searcher";
import { buildArticleRows, RowIdLinkMap, RowSearchResult } from "../utils/SearchRowsModel";
import { getMarkElems, getResultElems } from "./searchUtils";
import {
	highlightFragmentInDocportal,
	highlightFragmentInEditor,
} from "../../../components/Article/SearchHandler/ArticleSearchFragmentHander";

const DEBOUNCE_DELAY = 400;
const CHAT_DEBOUNCE_DELAY = DEBOUNCE_DELAY * 2;
const SEARCH_SYMBOL = Symbol();
const parser = new SimpleMarkdownParser();

export interface SearchProps {
	isHomePage: boolean;
	className?: string;
}

type SearchComponentData =
	| { type: "search"; rows: RowSearchResult[]; rowIdLinkMap: RowIdLinkMap }
	| { type: "chat"; chatData: RenderableTreeNodes };

const Search = (props: SearchProps) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { isHomePage, className } = props;
	const router = useRouter();
	const isMac = IsMacService.value;
	const query = SearchQueryService.value;
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
	const cancelDebouncingRef = useRef<() => void>(null);
	const abortControllerRef = useRef<AbortController>(null);

	const narrowMedia = useMediaQuery(cssMedia.JSnarrow);
	const blockRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const focusRef = useRef<HTMLAnchorElement>(null);
	const responseRef = useRef<HTMLDivElement>(null);
	const propertyFilterRef = useRef<HTMLDivElement>(null);

	const [focusId, setFocusId] = useState(0);
	const [isOpen, setIsOpen] = useState(false);
	const [data, _setData] = useState<SearchComponentData | null>(null);
	const [cursorFlaf, setCursorFlaf] = useState(true);
	const [searchAll, _setSearchAll] = useState(isHomePage);
	const [chatSearch, setChatSearch] = useState(false);

	const [indexProgress, setIndexProgress] = useState<number>(1);
	const indexing = indexProgress !== 1;

	const {
		filteredProperties,
		filterableProperties,
		shownFilterableProperties,
		propertySearch,
		propertiyValuesSearch,
		togglePropertyValue,
		clearFilteredProperty,
		clearFilteredProperties,
	} = usePropertyFilter({
		isReadOnlyPlatform: isReadOnly,
		properties: catalogProperties,
	});

	const setData: typeof _setData = (v) => {
		setFocusId(0);
		_setData(v);
	};

	const setSearchAll = (v: boolean) => {
		if (v === searchAll) return;

		setData(null);
		_setSearchAll(v);
	};

	const canUsePropertyFilter = !searchAll && !chatSearch;
	const hasPropertyFilter = canUsePropertyFilter && filteredProperties.length !== 0;
	const emptyInput = !query && !hasPropertyFilter;
	const initiateIndexingOnOpen = isBrowser || isTauri;
	const articlesLanguage =
		isCatalogExist && !searchAll ? currentArticleLanguage ?? catalogDefaultLanguage ?? "none" : undefined;

	const mousemoveHandler = () => {
		setCursorFlaf(true);
	};

	const currentPathname = ArticlePropsService.value?.pathname;

	const onLinkOpen = (articleUrl: string, searchFragmentInfo?: SearchFragmentInfo) => {
		setIsOpen(false);
		if (!isHomePage && articleUrl === currentPathname && searchFragmentInfo) {
			if (isBrowser || isTauri)
				highlightFragmentInEditor(searchFragmentInfo.text, searchFragmentInfo.indexInArticle);
			else if (isStatic) highlightFragmentInDocportal(searchFragmentInfo.text, searchFragmentInfo.indexInArticle);
		}
	};

	const keydownHandler = (e: KeyboardEvent) => {
		if (propertyFilterRef.current?.contains(document.activeElement)) return;

		if (e.code === "Slash" && (e.ctrlKey || e.metaKey)) {
			setIsOpen((prev) => !prev);
			return;
		}
		if (!isHomePage && e.code === "Enter" && (e.ctrlKey || e.metaKey)) {
			setSearchAll(!searchAll);
			return;
		}
		if (isOpen && data && data.type === "search" && data.rows.length) {
			if (e.code === "ArrowUp") {
				setCursorFlaf(false);
				if (focusId !== 0) setFocusId(focusId - 1);
			}
			if (e.code === "ArrowDown") {
				setCursorFlaf(false);
				const focusableElementCount = data.rowIdLinkMap.size;
				if (focusId !== focusableElementCount - 1) setFocusId(focusId + 1);
			}
			if (e.code === "Enter") {
				const infoById = data.rowIdLinkMap.get(focusId);
				if (infoById) {
					router.setUrl(infoById.url);
					onLinkOpen(infoById.openSideEffect.params.url, infoById.openSideEffect.params.fragmentInfo);
				}
				setFocusId(0);
				setIsOpen(false);
			}
		}
	};

	useLayoutEffect(() => {
		if (focusRef.current) {
			focusRef.current.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
		}
	}, [focusId]);

	let dataBreadcrumbs: LinksBreadcrumbProps["readyData"][] = undefined;

	if (data?.type === "search" && data.rows.length) {
		dataBreadcrumbs = data.rows.map((x) => {
			if (x.type === "catalog") return undefined;

			const titles: LinksBreadcrumbProps["readyData"]["titles"] = [];
			const links: LinksBreadcrumbProps["readyData"]["links"] = [];
			const onClicks: LinksBreadcrumbProps["readyData"]["onClicks"] = [];

			x.rawResult.breadcrumbs.forEach((y) => {
				titles.push(y.title);
				links.push({ pathname: y.url });
				onClicks.push(() => onLinkOpen(y.url));
			});

			return {
				titles,
				links,
				onClicks,
			};
		});
	}

	const loadData = async (query: string) => {
		if (!query && !hasPropertyFilter) return;

		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		if (chatSearch) {
			if (!query) return;
			await chatStream(query);
			return;
		}

		const data = await getSearchData(query);
		if (!data || abortController.signal.aborted) return;
		setData(data);
	};

	const getSearchData = async (query: string): Promise<SearchComponentData | null> => {
		const abortController = abortControllerRef.current;
		const propertyFilter: PropertyFilter = {
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

		const res = await FetchService.fetch<SearchResult[]>(
			apiUrlCreator.getSearchDataUrl(query, searchAll ? null : catalogName, undefined, articlesLanguage),
			canUsePropertyFilter ? JSON.stringify({ propertyFilter }) : undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			abortController.signal,
		);
		if (!res.ok || abortController.signal.aborted) return;

		const searchData = await res.json();
		const articleSearchData = searchData.filter((d) => searchAll || d.type === "article");

		const { rows, rowIdLinkMap } = buildArticleRows(articleSearchData);

		return {
			type: "search",
			rows,
			rowIdLinkMap,
		};
	};

	const chatStream = async (query: string) => {
		if (!query) return;
		const abortController = abortControllerRef.current;
		const responseLanguage = isCatalogExist ? currentArticleLanguage ?? catalogDefaultLanguage : undefined;
		const res = await FetchService.fetch<unknown>(
			apiUrlCreator.getSearchChatUrl(
				query,
				searchAll ? undefined : catalogName,
				articlesLanguage,
				responseLanguage,
			),
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			abortController.signal,
		);
		if (!res.ok || abortController.signal.aborted) return;

		let chatResponse = "";
		const itemGenerator = readNDJson<ResponseStreamItem>(res.body.getReader());

		for await (const item of itemGenerator) {
			if (abortController.signal.aborted) break;

			chatResponse += item.text;
			const chatData = await parser.parse(chatResponse);
			setData({
				type: "chat",
				chatData,
			});
		}
	};

	const handleProgressResponse = async (stream: NDJsonReadStream) => {
		const itemGenerator = readNDJson<ProgressItem>(stream);

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
	};

	const updateIndex = async () => {
		const res = await FetchService.fetch<unknown>(
			apiUrlCreator.getResetSearchDataUrl(searchAll ? undefined : catalogName),
		);
		if (!res.ok) return;
		await handleProgressResponse(res.body.getReader());
	};

	const loadIndexProgress = async () => {
		const res = await FetchService.fetch<unknown>(apiUrlCreator.getIndexingProgressUrl());
		if (!res.ok) return;
		await handleProgressResponse(res.body.getReader());
	};

	useEffect(() => {
		if (!initiateIndexingOnOpen || !isOpen) return;
		updateIndex();
	}, [isOpen, searchAll]);

	useEffect(() => {
		if (initiateIndexingOnOpen) return;

		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		let isCancelled = false;

		if (!isOpen || isStatic) {
			isCancelled = true;
			if (timeoutId) clearTimeout(timeoutId);
			return;
		}

		const tick = async () => {
			await loadIndexProgress();
			if (isCancelled) return;
			timeoutId = setTimeout(tick, 1000);
		};
		timeoutId = setTimeout(tick, 1000);

		return () => {
			isCancelled = true;
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, [initiateIndexingOnOpen, isOpen, isStatic, loadIndexProgress]);

	useEffect(() => {
		document.addEventListener("keydown", keydownHandler, false);
		document.addEventListener("mousemove", mousemoveHandler, false);
		return () => {
			document.removeEventListener("keydown", keydownHandler, false);
			document.removeEventListener("mousemove", mousemoveHandler, false);
		};
	});

	useEffect(() => {
		if (isHomePage) return;

		if (isOpen && blockRef.current) {
			blockRef.current.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
		}
	}, [blockRef.current, isOpen, isHomePage]);

	useEffect(() => {
		cancelDebouncingRef.current?.();
		cancelDebouncingRef.current = null;
		abortControllerRef.current?.abort();
		setData(null);
		loadData(query);
	}, [searchAll, chatSearch, filteredProperties]);

	return (
		<ModalLayout
			onClose={() => {
				setFocusId(0);
				setIsOpen(false);
			}}
			onOpen={() => {
				setIsOpen(true);
				if (inputRef.current && query) {
					inputRef.current.value = query;
					inputRef.current.select();
				}
			}}
			isOpen={isOpen}
			contentWidth={"minM"}
			trigger={
				isHomePage ? (
					<div>
						<Tooltip>
							<TooltipContent>
								<p>{t("search.name")}</p>
							</TooltipContent>
							<TooltipTrigger asChild>
								<IconButton
									iconClassName="w-5 h-5 stroke-[1.6]"
									className="p-2"
									size="lg"
									variant="ghost"
									icon={"search"}
								/>
							</TooltipTrigger>
						</Tooltip>
					</div>
				) : (
					<ButtonLink iconCode="search" textSize={TextSize.L} />
				)
			}
		>
			<div style={{ height: "100%", display: "flex", flexDirection: "column" }} data-qa={`search-modal`}>
				<div ref={blockRef} className={className + " modal"}>
					<ModalLayoutLight className="layer-two block-elevation-2">
						<div className="search-form form block-elevation-3">
							<div className="search-input-block">
								<div className="search-input">
									<a className="search-icon" style={{ cursor: "auto" }}>
										<Icon code={"search"} />
									</a>
									<Input
										ref={inputRef}
										type="text"
										onChange={(e) => {
											abortControllerRef.current?.abort();
											abortControllerRef.current = null;
											const query = e.target.value;
											SearchQueryService.value = query;
											setData(null);
											const debounceDelay = chatSearch ? CHAT_DEBOUNCE_DELAY : DEBOUNCE_DELAY;
											cancelDebouncingRef.current = debounceFunction(
												SEARCH_SYMBOL,
												() => loadData(query),
												debounceDelay,
											);
										}}
										onKeyDown={(e) => {
											if (e.code === "ArrowUp" || e.code === "ArrowDown") {
												e.preventDefault();
											}
										}}
										placeholder={t("search.placeholder")}
										data-qa={t("search.placeholder")}
									/>
									<div className="search-input-right-side">
										{canUsePropertyFilter && filterableProperties.array.length > 0 && (
											<PropertyFilterComponent
												ref={propertyFilterRef}
												properties={shownFilterableProperties.array}
												filteredProperties={filteredProperties}
												togglePropertyValue={togglePropertyValue}
											/>
										)}
										{!emptyInput && (
											<a
												className="search-icon"
												onClick={() => {
													abortControllerRef.current?.abort();
													SearchQueryService.value = "";
													setFocusId(0);
													clearFilteredProperties();
													inputRef.current.value = "";
													inputRef.current.focus();
												}}
											>
												<Icon code={"x"} />
											</a>
										)}
									</div>
								</div>
							</div>
							{indexing && <IndexingProgress progress={indexProgress} />}
							{canUsePropertyFilter && (
								<FilteredPropertyBlock
									properties={filteredProperties}
									catalogProperties={catalogProperties}
									togglePropertyValue={togglePropertyValue}
									clearFilteredProperty={clearFilteredProperty}
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
																					components: getComponents(),
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
												data.rows.map((d, i) => (
													<div key={d.id} style={{ overflow: "hidden" }} className="item">
														<div
															className={`item-title ${
																focusId === d.id ? "item-active" : ""
															}`}
															data-qa="qa-clickable"
															onMouseOver={() => {
																if (cursorFlaf) setFocusId(d.id);
															}}
														>
															<div>
																<Link
																	ref={focusId === d.id ? focusRef : null}
																	onMouseOver={() => {
																		if (cursorFlaf) setFocusId(d.id);
																	}}
																	onClick={() =>
																		onLinkOpen(
																			d.openSideEffect.params.url,
																			d.openSideEffect.params.fragmentInfo,
																		)
																	}
																	href={d.href}
																	className="flex item-center"
																>
																	{d.type === "article" ? (
																		<span className="line-clamp-1 item-title-text">
																			{getMarkElems(d.rawResult.title)}
																		</span>
																	) : (
																		<CatalogResultItem
																			catalog={{
																				name: d.rawResult.name,
																				title: d.rawResult.title,
																			}}
																		/>
																	)}
																</Link>

																{searchAll && d.type === "article" && (
																	<Link
																		onClick={() =>
																			onLinkOpen(
																				d.openSideEffect.params.url,
																				d.openSideEffect.params.fragmentInfo,
																			)
																		}
																		href={Url.from({
																			pathname: d.rawResult.catalog.url,
																		})}
																		className="breadcrumb-catalog"
																	>
																		<BreadcrumbCatalog
																			catalog={d.rawResult.catalog}
																			variant={breadcrumbCatalogVariant}
																		/>
																	</Link>
																)}

																{dataBreadcrumbs.length && (
																	<LinksBreadcrumb readyData={dataBreadcrumbs[i]} />
																)}
															</div>
															{d.type === "article" && d.rawResult.isRecommended && (
																<ArticlePropertyWrapper>
																	<PropertyComponent
																		type={PropertyTypes.flag}
																		icon={"star"}
																		value={undefined}
																		name={t("search.recommended")}
																		propertyStyle={"blue"}
																		style={{
																			cursor: "default",
																		}}
																		shouldShowValue={false}
																	/>
																</ArticlePropertyWrapper>
															)}
														</div>
														{d.type === "article" &&
															getResultElems(
																d.items,
																(id) => {
																	if (cursorFlaf) setFocusId(id);
																},
																onLinkOpen,
																focusId,
																focusRef,
															)}
													</div>
												))
											)}
										</div>
									)}
								</>
							)}
						</div>
					</ModalLayoutLight>
					<div className="bottom-content">
						<div className="absolute-bg " />
						<div className="prompt article">
							{!isHomePage && isCatalogExist && (
								<div className="bottomCheckbox">
									<div className={"text"}>
										<span className="cmd">{isMac ? <Icon code="command" /> : "Ctrl"}</span>
										<p>+</p>
										<span className="cmd">
											<Icon code="corner-down-left" />
										</span>
									</div>
									<Checkbox
										className="all-catalogs-checkbox"
										checked={searchAll}
										onChange={(isChecked) => {
											setSearchAll(isChecked);
										}}
									>
										<p>{t("search.all-catalogs")}</p>
									</Checkbox>
								</div>
							)}
							{vectorSearchEnabled && (
								<div className="bottomCheckbox">
									<Checkbox
										className="chat-search-checkbox"
										checked={chatSearch}
										onChange={(isChecked) => {
											setChatSearch(isChecked);
										}}
									>
										<p>{t("search.ai")}</p>
									</Checkbox>
								</div>
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
									style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}
								>
									<span className="cmd">{isMac ? <Icon code="command" /> : "Ctrl"}</span>+
									<span className="cmd">/</span>
									<p>{t("search.open")}</p>
								</div>
							)}
						</div>
					</div>
				</div>
				<div
					style={{ height: "100%" }}
					onClick={() => {
						setFocusId(0);
						setIsOpen(false);
					}}
				></div>
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
					margin-top: 0 !important;
					align-items: baseline !important;
					flex-shrink: 0;
				}

				.chat-title {
					gap: 0.5rem;
					display: flex;
					font-weight: 400;
					align-items: center;
					margin-bottom: 0.3em;
				}

				.item-title {
					display: flex;
					flex-wrap: wrap;
					font-weight: 400;
					align-items: center;
					justify-content: space-between;
					row-gap: 0.3em;
					padding: 3px 0;

					> div:first-of-type {
						display: flex;
						align-items: baseline;
						gap: 1.5rem;
					}

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

				.item-title-text {
					word-break: break-all;
				}

				.excerpt {
					font-size: 14px;
					font-weight: 300;
					padding: 3px 0;

					.cut-content {
						white-space: nowrap;
						overflow: hidden;
						display: block;
						text-overflow: ellipsis;
						width: 100%;
					}
				}

				.hidden-count-info {
					font-size: 12px;
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
			overflow: hidden !important;
			text-overflow: ellipsis !important;
		}
	}
`;

const breadcrumbCatalogVariant = css`
	align-items: unset;

	.title {
		align-self: baseline;
		font-size: 12px;
	}
`;
