import Fetcher from "@core-ui/ApiServices/Types/Fetcher";
import Url from "@core-ui/ApiServices/Types/Url";
import UseSWRService from "@core-ui/ApiServices/UseSWRService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SearchQueryService from "@core-ui/ContextServices/SearchQuery";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useEffect, useRef, useState } from "react";
import { SWRResponse } from "swr";
import useLocalize from "../../../extensions/localization/useLocalize";
import { CatalogLink, CategoryLink, ItemLink } from "../../../extensions/navigation/NavigationLinks";
import { SearchItem } from "../../../extensions/search/Searcher";
import { useRouter } from "../../../logic/Api/useRouter";
import Path from "../../../logic/FileProvider/Path/Path";
import IsOpenModalService from "../../../ui-logic/ContextServices/IsOpenMpdal";
import Checkbox from "../../Atoms/Checkbox";
import Icon from "../../Atoms/Icon";
import Link from "../../Atoms/Link";
import Breadcrumb from "../../Breadcrumbs/ArticleBreadcrumb";
import Error from "../../Error";
import Input from "../../Labels/Input";
import ModalLayout from "../../Layouts/Modal";
import ModalLayoutLight from "../../Layouts/ModalLayoutLight";

const Search = styled(
	({
		isHomePage,
		catalogLinks,
		itemLinks,
		className,
	}: {
		isHomePage: boolean;
		catalogLinks: CatalogLink[];
		itemLinks?: ItemLink[];
		className?: string;
	}) => {
		const router = useRouter();
		const isMac = IsMacService.value;
		const query = SearchQueryService.value;
		const isLogged = PageDataContextService.value.isLogged;
		const isOpenModal = IsOpenModalService.value;
		const apiUrlCreator = ApiUrlCreatorService.value;

		const narrowMedia = useMediaQuery(cssMedia.JSnarrow);
		const blockRef = useRef<HTMLDivElement>(null);
		const inputRef = useRef<HTMLInputElement>(null);
		const focusRef = useRef<HTMLAnchorElement>(null);
		const responseRef = useRef<HTMLDivElement>(null);
		const itemsResponseRef = useRef<HTMLDivElement>(null);

		const [focusId, setFocusId] = useState(0);
		const [isOpen, setIsOpen] = useState(false);
		const [timeout, setMyTimeout] = useState(null);
		const [cursorFlaf, setCursorFlaf] = useState(true);
		const [searchAll, setSearchAll] = useState(isHomePage);
		const [requestTroll, setRequestTroll] = useState(true);
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
			if (isOpen && data && data.length) {
				if (e.code === "ArrowUp") {
					setCursorFlaf(false);
					if (focusId !== 0) setFocusId(focusId - 1);
					focusRef.current.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
				}
				if (e.code === "ArrowDown") {
					setCursorFlaf(false);
					if (focusId !== data.length - 1) setFocusId(focusId + 1);
					focusRef.current.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
				}
				if (e.code === "Enter") {
					router.pushPath(data[focusId].url);
					setFocusId(0);
					setIsOpen(false);
				}
			}
		};

		const { data, error }: SWRResponse<SearchItem[], any> = UseSWRService.getData<SearchItem[]>(
			apiUrlCreator.getSearchDataUrl(searchAll, query),
			Fetcher.json,
			query != "" && query != null && requestTroll,
		);

		const setHeight = () => {
			if (blockRef.current) blockRef.current.style.height = query && (!data || !data.length) ? "193.59px" : "";
			if (document && responseRef.current && itemsResponseRef.current) {
				responseRef.current.style.height = `${document.body.clientHeight}px`;
				const blockHeight = itemsResponseRef.current.clientHeight + 104;
				if (document.body.clientHeight * 0.8 > blockHeight) blockRef.current.style.height = `${blockHeight}px`;
				else blockRef.current.style.height = "100%";
			}
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

		if (data && data.length) {
			if (isHomePage) {
				data.forEach((d) => {
					homePageBreadcrumbDatas.push(
						catalogLinks.find((link) => link.name === new Path(d.url).rootDirectory.toString()),
					);
				});
			} else {
				data.forEach((d) => {
					const search = (itemLinks: ItemLink[], catLinks: CategoryLink[]) => {
						itemLinks.forEach((link) => {
							if (d.url.includes(link.pathname)) {
								if (!(link as CategoryLink).items || d.url === link.pathname) {
									articleBreadcrumbDatas.push({
										titles: catLinks.map((l) => l.title),
										links: catLinks,
									});
								} else search((link as CategoryLink).items, [...catLinks, link as CategoryLink]);
							}
						});
					};
					search(itemLinks, []);
				});
			}
		}

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
				trigger={
					<a data-qa="qa-clickable">
						<Icon isAction code={"search"} />
						{isHomePage ? <span>{useLocalize("search")}</span> : null}
					</a>
				}
			>
				<div style={{ height: "100%" }} data-qa={`search-modal`}>
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
											setFocusId(0);
											SearchQueryService.value = e.target.value;
											setRequestTroll(false);
											if (timeout) clearTimeout(timeout);
											const tID = setTimeout(() => {
												setRequestTroll(true);
												clearTimeout(timeout);
											}, 400);
											setMyTimeout(tID);
										}}
										placeholder={useLocalize("searchPlaceholder")}
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
											<Icon code={"times"} />
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
														__html: useLocalize("searchOptions"),
													}}
												/>
											</div>
										</div>
									</>
								) : (
									<>
										{error ? (
											<div className="msg tip">
												<div className="article">
													<Error error={error} isLogged={isLogged} />
												</div>
											</div>
										) : (
											<>
												{!data ? (
													<div className="msg loading">
														<Icon code="spinner fa-spin" />
														<span>{useLocalize("loading")}</span>
													</div>
												) : !data.length ? (
													<div className="msg empty">
														<Icon code="empty-set" />
														<span>{useLocalize("articlesNotFound")}</span>
													</div>
												) : (
													<div ref={itemsResponseRef}>
														{data?.map((d, id) => (
															<Link
																key={id}
																onClick={() => setIsOpen(false)}
																ref={focusId === id ? focusRef : null}
																href={Url.from({ pathname: d.url })}
																onMouseOver={() => {
																	if (cursorFlaf) setFocusId(id);
																}}
																className={`item ${
																	focusId === id ? "item-active" : ""
																}`}
															>
																{d.count > 1 && (
																	<span className="count">{d.count} шт.</span>
																)}
																<div className="item-title">
																	<div className="title-text">
																		{d.name.targets.map((t) => {
																			return (
																				<>
																					<span>{t.start}</span>
																					<span className="match">
																						{t.target}
																					</span>
																				</>
																			);
																		})}
																		<span>{d.name.end}</span>
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
																{d.paragraph.map((p) => (
																	<div key={p.target} className="excerpt">
																		<span>{p.prev}</span>
																		<span className="match">{p.target}</span>
																		<span>{p.next}</span>
																	</div>
																))}
															</Link>
														))}
													</div>
												)}
											</>
										)}
									</>
								)}
							</div>
						</ModalLayoutLight>
						<div className="bottom-content prompt article ">
							<div className="absolute-bg " />
							{isHomePage ? null : (
								<div className="searchAll">
									<div className={"text"}>
										<span className="cmd">{isMac ? <Icon code="command" /> : "Ctrl"}</span>
										<p>+</p>
										<span className="cmd">
											<Icon code="arrow-turn-down-left" />
										</span>
									</div>
									<Checkbox
										className="all-catalogs-checkbox"
										checked={searchAll}
										onChange={(isChecked) => setSearchAll(isChecked)}
									>
										<p>{useLocalize("searchInAllCatalogs")}</p>
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
											<Icon code="arrow-turn-down-left" />
										</span>
										<p>{useLocalize("toNavigate")}</p>
									</div>
									<div className={"text"}>
										<span className="cmd">Esc</span>
										<p>{useLocalize("close")}</p>
									</div>
								</>
							)}

							{narrowMedia ? null : (
								<div
									className={"text"}
									style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}
								>
									<span className="cmd">{isMac ? <Icon code="command" /> : "Ctrl"}</span>+
									<span className="cmd">
										<Icon code="slash-forward" />
									</span>
									<p>{useLocalize("openSearch")}</p>
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
	},
)`
	height: 274px;
	transition: all 0.3s;

	.layer-two {
		overflow: hidden;

		.form > div {
			gap: 1rem;
			width: 100%;
			display: flex;
			height: 2.5rem;
			flex-direction: row;
			align-items: baseline;
			border-radius: var(--radius-small);

			input {
				width: 100%;
				height: 100%;
				border: none;
				outline: 0px;
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

				&.empty {
					opacity: 0.5;
				}
			}

			.msg.tip {
				text-align: left;
				margin: 0rem 1rem 1rem 1rem !important;

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
				color: var(--color-primary-general);
				background: var(--color-contextmenu-bg);

				.breadcrumb {
					margin-top: 0 !important;
					align-items: baseline !important;
				}

				.item-title {
					gap: 0.5rem;
					display: flex;
					font-weight: 400;
					margin-bottom: 0.3em;
					align-items: baseline;

					.match {
						background: yellow;
						color: var(--color-search-text);
					}
				}

				.excerpt {
					font-size: 14px;
					font-weight: 300;

					.match {
						background: rgb(255 255 0 / 70%);
						color: var(--color-search-text);
					}
				}

				.count {
					float: right;
					opacity: 0.4;
					font-size: 0.8em;
				}
			}

			.item-active {
				text-decoration: none;
				color: var(--color-primary);
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

		.searchAll {
			gap: 0.3rem;
			display: flex;
			align-items: center;

			.text {
				gap: 0.1rem;
			}
		}
	}
`;

export default Search;
