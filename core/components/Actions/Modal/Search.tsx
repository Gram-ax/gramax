import { TextSize } from "@components/Atoms/Button/Button";
import Input from "@components/Atoms/Input";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import Url from "@core-ui/ApiServices/Types/Url";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SearchQueryService from "@core-ui/ContextServices/SearchQuery";
import debounceFunction from "@core-ui/debounceFunction";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { useRouter } from "@core/Api/useRouter";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import { CatalogLink, CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import useMediaQuery from "@mui/material/useMediaQuery";
import { IconButton } from "@ui-kit/Button";
import { Fragment, useEffect, useRef, useState } from "react";
import { SearchItem } from "../../../extensions/serach/Searcher";
import IsOpenModalService from "../../../ui-logic/ContextServices/IsOpenMpdal";
import Checkbox from "../../Atoms/Checkbox";
import Icon from "../../Atoms/Icon";
import Link from "../../Atoms/Link";
import Breadcrumb from "../../Breadcrumbs/LinksBreadcrumb";
import ModalLayout from "../../Layouts/Modal";
import ModalLayoutLight from "../../Layouts/ModalLayoutLight";
// import Path from "../../../logic/FileProvider/Path/Path";
// import RouterPathProvider from "@core/RouterPath/RouterPathProvider";

const DEBOUNCE_DELAY = 400;
const SEARCH_SYMBOL = Symbol();

export interface SearchProps {
	isHomePage: boolean;
	catalogLinks: CatalogLink[];
	itemLinks?: ItemLink[];
	className?: string;
}

const Search = (props: SearchProps) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { isHomePage, catalogLinks, itemLinks, className } = props;
	const router = useRouter();
	const isMac = IsMacService.value;
	const query = SearchQueryService.value;
	const isOpenModal = IsOpenModalService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const catalogName = CatalogPropsService.value?.name;
	const catalogDefaultLanguage = CatalogPropsService.value?.language;
	const currentArticleLanguage = PageDataContextService.value?.language?.content;
	const { isNext } = usePlatform();
	const vectorSearchEnabled = (isNext && PageDataContextService.value?.conf?.ai?.enabled) ?? false;
	const isCatalogExist = !!catalogName;
	const abortControllerRef = useRef<AbortController>(null);

	const narrowMedia = useMediaQuery(cssMedia.JSnarrow);
	const blockRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const focusRef = useRef<HTMLAnchorElement>(null);
	const responseRef = useRef<HTMLDivElement>(null);
	const itemsResponseRef = useRef<HTMLDivElement>(null);

	const [focusId, setFocusId] = useState(0);
	const [isOpen, setIsOpen] = useState(false);
	const [data, setData] = useState<
		{ type: "search"; searchData: SearchItem[] } | { type: "chat"; chatData: RenderableTreeNodes }
	>(null);
	const [cursorFlaf, setCursorFlaf] = useState(true);
	const [searchAll, setSearchAll] = useState(isHomePage);
	const [chatSearch, setChatSearch] = useState(false);
	const homePageBreadcrumbDatas: CatalogLink[] = [];
	const articleBreadcrumbDatas: { titles: string[]; links: CategoryLink[] }[] = [];

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
		if (isOpen && data && data.type === "search" && data.searchData.length) {
			if (e.code === "ArrowUp") {
				setCursorFlaf(false);
				if (focusId !== 0) setFocusId(focusId - 1);
				focusRef.current.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
			}
			if (e.code === "ArrowDown") {
				setCursorFlaf(false);
				if (focusId !== data.searchData.length - 1) setFocusId(focusId + 1);
				focusRef.current.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
			}
			if (e.code === "Enter") {
				router.pushPath(data?.searchData?.[focusId]?.url);
				setFocusId(0);
				setIsOpen(false);
			}
		}
	};

	const setHeight = () => {
		if (blockRef.current)
			blockRef.current.style.height =
				query && (!data || (data.type === "search" && !data.searchData.length)) ? "193.59px" : "";
		if (document && responseRef.current && itemsResponseRef.current) {
			responseRef.current.style.height = `${document.body.clientHeight}px`;
			const blockHeight = itemsResponseRef.current.clientHeight + 104;
			if (document.body.clientHeight * 0.8 > blockHeight) blockRef.current.style.height = `${blockHeight}px`;
			else blockRef.current.style.height = "100%";
		}
	};

	if (data?.type === "search" && data.searchData.length) {
		if (isHomePage) {
			data.searchData.forEach((d) => {
				const url = new Path(d.url);
				const isNewPath = RouterPathProvider.isEditorPathname(url);
				const catalogName = isNewPath
					? RouterPathProvider.parsePath(url).catalogName
					: RouterPathProvider.parseItemLogicPath(url).catalogName;
				homePageBreadcrumbDatas.push(catalogLinks.find((link) => link.name === catalogName));
			});
		} else {
			data.searchData.forEach((d) => {
				const search = (itemLinks: ItemLink[], catLinks: CategoryLink[]) => {
					itemLinks.forEach((link) => {
						if (!d.url.includes(link.pathname)) return;

						if (!(link as CategoryLink).items || d.url === link.pathname) {
							articleBreadcrumbDatas.push({
								titles: catLinks.map((l) => l.title),
								links: catLinks,
							});
						} else {
							search((link as CategoryLink).items, [...catLinks, link as CategoryLink]);
						}
					});
				};

				search(itemLinks, []);
			});
		}
	}

	const loadData = async (query: string) => {
		if (!query) return;

		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		const data = chatSearch ? await getChatData(query) : await getSearchData(query);

		if (!data || abortController.signal.aborted) return;
		setData(data);
	};

	const getSearchData = async (query: string) => {
		if (!query) return;
		const res = await FetchService.fetch<SearchItem[]>(
			apiUrlCreator.getSearchDataUrl(query, searchAll ? null : catalogName),
		);
		if (!res.ok) return;
		return {
			type: "search" as const,
			searchData: await res.json(),
		};
	};

	const getChatData = async (query: string) => {
		if (!query) return;
		const articlesLanguage =
			isCatalogExist && !searchAll ? currentArticleLanguage ?? catalogDefaultLanguage ?? "none" : null;
		const responseLanguage = isCatalogExist ? currentArticleLanguage ?? catalogDefaultLanguage : null;
		const res = await FetchService.fetch<RenderableTreeNodes>(
			apiUrlCreator.getSearchChatUrl(query, searchAll ? null : catalogName, articlesLanguage, responseLanguage),
		);
		if (!res.ok) return;
		return {
			type: "chat" as const,
			chatData: await res.json(),
		};
	};

	useEffect(() => {
		setHeight();
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
		setData(null);
		loadData(query);
	}, [searchAll, chatSearch]);

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
					setHeight();
				}
			}}
			isOpen={isOpen}
			contentWidth={"minM"}
			trigger={
				isHomePage ? (
					<IconButton variant="ghost" icon={"search"} />
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
											// Чтобы не отправлять лишние запросы
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
						</div>
						<div className="response" ref={responseRef}>
							{!query ? (
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
									) : data.type === "search" && !data.searchData.length ? (
										<div className="msg empty">
											<Icon code="circle-slash-2" />
											<span>{t("search.articles-not-found")}</span>
										</div>
									) : (
										<div ref={itemsResponseRef}>
											{data.type === "chat" ? (
												<div className="item">
													<div style={{ overflow: "hidden" }}>
														<div className="item-title" data-qa="qa-clickable">
															<div className="title-text">
																<span>✨</span>
															</div>
														</div>

														<div className="excerpt">
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
												data.searchData.map((d, id) => (
													<Link
														key={id}
														onClick={() => setIsOpen(false)}
														ref={focusId === id ? focusRef : null}
														href={Url.from({ pathname: d.url })}
														onMouseOver={() => {
															if (cursorFlaf) setFocusId(id);
														}}
														className={`item ${focusId === id ? "item-active" : ""}`}
													>
														<div style={{ overflow: "hidden" }}>
															{d.count > 1 && (
																<span className="count">
																	{d.count} {t("values")}.
																</span>
															)}

															<div className="item-title" data-qa="qa-clickable">
																<div className="title-text">
																	<span>
																		{d.name.targets.map((t, index) => {
																			return (
																				<Fragment key={index}>
																					{t.start}
																					<strong className="match">
																						{t.target}
																					</strong>
																				</Fragment>
																			);
																		})}
																		{d.name.end}
																	</span>
																</div>

																{isHomePage && homePageBreadcrumbDatas.length ? (
																	<Breadcrumb
																		catalogLink={homePageBreadcrumbDatas[id]}
																	/>
																) : (
																	<Breadcrumb
																		readyData={articleBreadcrumbDatas[id]}
																	/>
																)}
															</div>

															{d.paragraph.map((p, index) =>
																index > 5 ? null : (
																	<div
																		key={index}
																		className="excerpt"
																		data-qa="qa-clickable"
																	>
																		<span className="cut-content">
																			{p.prev}
																			<strong className="match">
																				{p.target}
																			</strong>
																			{p.next}
																		</span>
																	</div>
																),
															)}
														</div>
													</Link>
												))
											)}
										</div>
									)}
								</>
							)}
						</div>
					</ModalLayoutLight>
					<div className="bottom-content prompt article ">
						<div className="absolute-bg " />
						{isHomePage || !isCatalogExist ? null : (
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
						{!vectorSearchEnabled ? null : (
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
						{narrowMedia ? null : (
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

						{narrowMedia ? null : (
							<div className={"text"} style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
								<span className="cmd">{isMac ? <Icon code="command" /> : "Ctrl"}</span>+
								<span className="cmd">/</span>
								<p>{t("search.open")}</p>
							</div>
						)}
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

		.form > div {
			width: 100%;
			display: flex;
			height: 1.5rem;
			flex-direction: row;
			align-items: center;
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
				}

				.item-title {
					gap: 0.5rem;
					display: flex;
					font-weight: 400;
					align-items: center;
					margin-bottom: 0.3em;

					.article-breadcrumb {
						margin-top: 0;
					}
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

				.match {
					font-weight: inherit;
					font-size: inherit;
					line-height: inherit;
					background: rgb(255 255 0 / 70%);
					color: var(--color-search-text);
				}

				.count {
					float: right;
					opacity: 0.4;
					font-size: 0.8em;
				}
			}

			.item-active {
				text-decoration: none;
				background: var(--color-lev-sidebar-hover);
			}
		}
	}

	.prompt {
		display: flex;
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
