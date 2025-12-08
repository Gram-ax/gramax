import { ResponseStreamItem } from "@app/commands/search/chat";
import { SearchFragmentInfo } from "@components/Actions/Modal/ArticleFragmentCounter/ArticleFragmentCounter";
import { getMarkElems, getResultElems } from "@components/Actions/Modal/searchUtils";
import { highlightSearchFragment } from "@components/Article/SearchHandler/ArticleSearchFragmentHander";
import { TextSize } from "@components/Atoms/Button/Button";
import Input from "@components/Atoms/Input";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { useGetCatalogLogoSrc } from "@core-ui/ContextServices/CatalogLogoService/catalogLogoHooks";
import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SearchQueryService from "@core-ui/ContextServices/SearchQuery";
import debounceFunction from "@core-ui/debounceFunction";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { useRouter } from "@core/Api/useRouter";
import { readNDJson } from "@core/utils/readNDJson";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import SimpleMarkdownParser from "@ext/markdown/core/Parser/SimpleMarkdownParser";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import { BaseLink } from "@ext/navigation/NavigationLinks";
import { ArticlePropertyWrapper } from "@ext/properties/components/ArticlePropertyWrapper";
import AddProperty from "@ext/properties/components/Helpers/AddProperty";
import PropertyComponent from "@ext/properties/components/Property";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { updateProperty } from "@ext/properties/logic/changeProperty";
import combineProperties from "@ext/properties/logic/combineProperties";
import { Property, PropertyTypes } from "@ext/properties/models";
import { useMediaQuery } from "@react-hook/media-query";
import { IconButton } from "@ui-kit/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { Progress } from "@ui-kit/Progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ProgressItem, SearchResult, SearchResultMarkItem } from "../../../extensions/serach/Searcher";
import IsOpenModalService from "../../../ui-logic/ContextServices/IsOpenMpdal";
import Checkbox from "../../Atoms/Checkbox";
import Icon from "../../Atoms/Icon";
import Link from "../../Atoms/Link";
import LinksBreadcrumb from "../../Breadcrumbs/LinksBreadcrumb";
import ModalLayout from "../../Layouts/Modal";
import ModalLayoutLight from "../../Layouts/ModalLayoutLight";
import { buildArticleRows, RowIdLinkMap, RowSearchResult } from "./SearchRowsModel";

const DEBOUNCE_DELAY = 400;
const SEARCH_SYMBOL = Symbol();
const parser = new SimpleMarkdownParser();

const cloneProperty = (prop: Property): Property => {
	return {
		...prop,
		values: [...(prop.values ?? [])],
		value: [...(prop.value ?? [])],
	};
};

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
	const isOpenModal = IsOpenModalService.value;
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
	const abortControllerRef = useRef<AbortController>(null);

	const narrowMedia = useMediaQuery(cssMedia.JSnarrow);
	const blockRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const focusRef = useRef<HTMLAnchorElement>(null);
	const responseRef = useRef<HTMLDivElement>(null);

	const [focusId, setFocusId] = useState(0);
	const [isOpen, setIsOpen] = useState(false);
	const [data, setData] = useState<SearchComponentData | null>(null);
	const [cursorFlaf, setCursorFlaf] = useState(true);
	const [searchAll, setSearchAll] = useState(isHomePage);
	const [chatSearch, setChatSearch] = useState(false);
	const [indexProgress, setIndexProgress] = useState<number>(1);
	const [filteredProps, setPropsFilter] = useState<Property[]>([]);
	const indexing = indexProgress !== 1;

	const emptyInput = !query && filteredProps.length === 0;
	const canUsePropFilter = (isBrowser || isTauri) && !searchAll && !chatSearch;
	const articlesLanguage =
		isCatalogExist && !searchAll ? currentArticleLanguage ?? catalogDefaultLanguage ?? "none" : undefined;

	const usedProps = useMemo(() => {
		const res = new Map<string, string[]>();
		if (data?.type !== "search" || data.rows.length === 0) return res;

		data.rows.forEach((x) => {
			if (x.type !== "article") return;

			x.rawResult.properties.forEach((y) => {
				const ex = res.get(y.name);
				if (ex === undefined) {
					res.set(y.name, [...(y.value ?? [])]);
					return;
				}

				if (!y.value) return;

				if (Array.isArray(y.value)) {
					ex.push(...y.value.filter((z) => !ex.includes(z)));
				} else {
					if (!ex.includes(y.value)) ex.push(y.value);
				}
			});
		});

		return res;
	}, [data]);

	const filterableCatalogProps = useMemo(() => {
		return [...catalogProperties.values()].filter((x) => x.type !== PropertyTypes.blockMd);
	}, [catalogProperties]);

	const filterableProps = useMemo(() => {
		if (usedProps.size === 0) return new Map(filterableCatalogProps.map((x) => [x.name, x]));

		return new Map(
			filterableCatalogProps
				.map((x) => {
					const clonedProp = cloneProperty(x);
					const usedProp = usedProps.get(x.name);
					if (usedProp === undefined) return undefined;

					clonedProp.values = usedProp;
					return [x.name, clonedProp] as [string, Property];
				})
				.filter((x) => x !== undefined),
		);
	}, [usedProps, filterableCatalogProps]);

	const mousemoveHandler = () => {
		setCursorFlaf(true);
	};

	const keydownHandler = (e: KeyboardEvent) => {
		if (e.code === "Slash" && (e.ctrlKey || e.metaKey) && !isOpenModal) {
			setIsOpen(true);
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
					infoById.onLinkOpen();
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

	let dataBreadcrumbs: { titles: string[]; links: BaseLink[] }[] = undefined;

	if (data?.type === "search" && data.rows.length) {
		dataBreadcrumbs = data.rows.map((x) => {
			if (x.type === "catalog") return undefined;

			const titles: string[] = [];
			const links: BaseLink[] = [];

			x.rawResult.breadcrumbs.forEach((x) => {
				titles.push(x.title);
				links.push({ pathname: x.pathname });
			});

			return {
				titles,
				links,
			};
		});
	}

	const currentPathname = ArticlePropsService.value?.pathname;

	const onLinkClick = (articleUrl: string, searchFragmentInfo?: SearchFragmentInfo) => {
		setIsOpen(false);
		if (!isReadOnly && !isHomePage && articleUrl === currentPathname && searchFragmentInfo) {
			highlightSearchFragment(searchFragmentInfo.text, searchFragmentInfo.indexInArticle, "editor");
		}
	};

	const loadData = async (query: string) => {
		if (!query && filteredProps.length === 0) return;

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
		const res = await FetchService.fetch<SearchResult[]>(
			apiUrlCreator.getSearchDataUrl(query, searchAll ? null : catalogName, undefined, articlesLanguage),
			JSON.stringify({
				properties: canUsePropFilter
					? filteredProps.map((x) => ({
							key: x.name,
							value: x.value ?? true,
					  }))
					: undefined,
			}),
		);
		if (!res.ok) return;

		const searchData = await res.json();
		const articleSearchData = searchData.filter((d) => isHomePage || d.type === "article");

		const { rows, rowIdLinkMap } = buildArticleRows(articleSearchData, (articleUrl, searchFragmentInfo) =>
			onLinkClick(articleUrl, searchFragmentInfo),
		);

		return {
			type: "search",
			rows,
			rowIdLinkMap,
		};
	};

	const chatStream = async (query: string) => {
		if (!query) return;
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
			abortControllerRef.current.signal,
		);
		if (!res.ok) return;

		let chatResponse = "";
		const itemGenerator = readNDJson<ResponseStreamItem>(res.body.getReader());

		for await (const item of itemGenerator) {
			chatResponse += item.text;
			const chatData = await parser.parse(chatResponse);
			setData({
				type: "chat",
				chatData,
			});
		}
	};

	const loadIndexProgress = async () => {
		const res = await FetchService.fetch<unknown>(apiUrlCreator.getIndexingProgressUrl());
		if (!res.ok) return;

		const itemGenerator = readNDJson<ProgressItem>(res.body.getReader());

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

	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		let isCancelled = false;

		if (!isOpenModal || isStatic) {
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
	}, [isOpenModal, isStatic, loadIndexProgress]);

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
		abortControllerRef.current?.abort();
		setData(null);
		loadData(query);
	}, [searchAll, chatSearch, filteredProps]);

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
							<div>
								<div>
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
											let debounceDelay = DEBOUNCE_DELAY;
											if (chatSearch) {
												debounceDelay *= 2;
											}
											debounceFunction(SEARCH_SYMBOL, () => loadData(query), debounceDelay);
										}}
										placeholder={t("search.placeholder")}
										data-qa={t("search.placeholder")}
									/>
									{!query ? null : (
										<a
											className="search-icon"
											onClick={() => {
												abortControllerRef.current?.abort();
												SearchQueryService.value = "";
												setFocusId(0);
												inputRef.current.value = "";
												inputRef.current.focus();
											}}
										>
											<Icon code={"x"} />
										</a>
									)}
								</div>
								{canUsePropFilter && filterableProps.size > 0 && (
									<div>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<IconButton
													variant="text"
													size="sm"
													icon="list-plus"
													data-qa="qa-add-property"
												/>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="start">
												<AddProperty
													properties={[]}
													canEdit={false}
													catalogProperties={filterableProps}
													onSubmit={(propId, value) =>
														setPropsFilter((prev) => {
															const newProps = updateProperty(
																propId,
																value,
																filterableProps,
																prev,
															);
															if (!newProps) return prev;
															return combineProperties(newProps, filterableProps);
														})
													}
												/>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								)}
							</div>
						</div>
						{canUsePropFilter && filteredProps.length > 0 && (
							<div className="form block-elevation-1 properties-block">
								<div>
									<div className="absolute-bg-properties " />
									<ArticlePropertyWrapper>
										{filteredProps.map((prop, i) => (
											<div key={i}>
												<PropertyComponent
													key={prop.name}
													type={prop.type}
													icon={prop.icon}
													value={
														prop.value?.length && prop.value[0].length
															? prop.value
															: prop.name
													}
													onClear={() => {
														setPropsFilter((prev) => {
															return prev.filter((x) => x !== prop);
														});
													}}
													name={prop.name}
													propertyStyle={prop.style}
													style={{
														cursor: "default",
													}}
													shouldShowValue={prop.type !== PropertyTypes.flag}
												/>
											</div>
										))}
									</ArticlePropertyWrapper>
								</div>
							</div>
						)}
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
															<div className="flex items-center w-full">
																<Link
																	ref={focusId === d.id ? focusRef : null}
																	onMouseOver={() => {
																		if (cursorFlaf) setFocusId(d.id);
																	}}
																	onClick={d.onClick}
																	href={d.href}
																	className="flex item-center"
																>
																	{d.type === "article" ? (
																		<span className="line-clamp-1 item-title-text">
																			{getMarkElems(d.rawResult.title)}
																		</span>
																	) : (
																		<CatalogLabel
																			catalog={{
																				name: d.rawResult.name,
																				title: d.rawResult.title,
																			}}
																		/>
																	)}
																</Link>

																{searchAll && d.type === "article" && (
																	<LinksBreadcrumb catalog={d.rawResult.catalog} />
																)}
																{dataBreadcrumbs.length && (
																	<LinksBreadcrumb
																		readyData={dataBreadcrumbs[i]}
																	/>
																)}
															</div>
															{d.type === "article" &&
																d.rawResult.isRecommended && (
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
						{indexing && (
							<div className="indexing-info">
								<div className="indexing-info-text">{t("search.indexing-info")}</div>
								<Progress max={1} value={indexProgress}></Progress>
							</div>
						)}
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

	span.gr-file {
		color: var(--color-link);
	}

	span.gr-file::before {
		content: var(--content-file-plus);
		vertical-align: text-bottom;
		line-height: 1;
	}

	.layer-two {
		overflow: hidden;

		.search-form > div {
			width: 100%;
			display: flex;
			height: 1.5rem;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;

			> div:nth-child(1) {
				width: 100%;
				display: flex;
				gap: var(--distance-i-span);
				border-radius: var(--radius-small);

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

		.properties-block {
			padding: 0.5rem;
			position: relative;

			.absolute-bg-properties {
				left: 0;
				top: -15px;
				width: 100%;
				z-index: 0;
				height: 1rem;
				position: absolute;
				background: var(--color-article-bg);
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
						gap: 0.5rem;
						align-items: center;
						display: flex;
					}

					.article-breadcrumb {
						margin-top: 0;
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

					.hidden-count-info {
						font-size: 12px;
					}
				}

				.article-header {
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

interface CatalogLabelProps {
	catalog: { name: string; title: SearchResultMarkItem[] };
	className?: string;
}

const _CatalogLabel = ({ catalog, className }: CatalogLabelProps) => {
	const { isExist, src } = useGetCatalogLogoSrc(catalog?.name);

	return (
		<div className={className}>
			<span className="catalog-logo">
				{isExist && <img src={src} alt={catalog.name} />}
				<span>{getMarkElems(catalog.title)}</span>
			</span>
		</div>
	);
};

const CatalogLabel = styled(_CatalogLabel)`
	min-width: 0;
	display: flex;
	align-items: center;

	img {
		width: 100%;
		margin: 0px;
		max-width: 20px;
		max-height: 20px;
		box-shadow: none;
	}

	.catalog-logo {
		display: flex;
		gap: 0.3rem;
		align-items: center;
		white-space: nowrap;
	}
`;
