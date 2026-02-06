import Link from "@components/Atoms/Link";
import LinksBreadcrumb from "@components/Breadcrumbs/LinksBreadcrumb";
import Url from "@core-ui/ApiServices/Types/Url";
import { css } from "@emotion/react";
import t from "@ext/localization/locale/translate";
import { ArticlePropertyWrapper } from "@ext/properties/components/ArticlePropertyWrapper";
import PropertyComponent from "@ext/properties/components/Property";
import { PropertyTypes } from "@ext/properties/models";
import BreadcrumbCatalog from "@ext/serach/components/BreadcrumbCatalog";
import { CatalogResultItem } from "@ext/serach/components/CatalogResultItem";
import { getMarkElems, getResultElems } from "@ext/serach/components/searchUtils";
import { useSearchResults } from "@ext/serach/components/useSearchResults";
import { type CurrentScrollData, scrollToElement } from "@ext/serach/components/utils/scrollToElement";
import type { SearchFragmentInfo } from "@ext/serach/utils/ArticleFragmentCounter/ArticleFragmentCounter";
import type { FocusItem } from "@ext/serach/utils/FocusItemsCollector";
import type { RowIdLinkMap, RowSearchResult } from "@ext/serach/utils/SearchRowsModel";
import { type RefObject, useEffect, useRef, useState } from "react";

export interface SearchResultsProps {
	rowIdLinkMap: RowIdLinkMap;
	rows: RowSearchResult[];
	searchAll: boolean;
	containerRef: RefObject<HTMLElement>;
	focusItem: FocusItem | undefined;
	setFocusItem: (item: FocusItem) => void;
	onLinkOpen: (data: {
		url: string;
		searchFragmentInfo?: SearchFragmentInfo;
		title?: string;
		catalog?: string;
		isRecommended?: boolean;
	}) => void;
}

export const SearchResults = (props: SearchResultsProps) => {
	const { rows, searchAll, containerRef, onLinkOpen, focusItem, setFocusItem, rowIdLinkMap } = props;
	const focusRef = useRef<HTMLAnchorElement>(null);
	const scrollAnimRef = useRef<CurrentScrollData>({});
	const [cursorFlag, setCursorFlag] = useState(true);

	// biome-ignore lint/correctness/useExhaustiveDependencies: TODO: fix
	useEffect(() => {
		focusRef.current = null;
	}, [rows]);

	const { focus, results } = useSearchResults({
		rows,
		focusItem,
		setFocusItem,
		onLinkOpen,
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: TODO: fix
	useEffect(() => {
		if (!cursorFlag && focusRef.current && containerRef.current) {
			scrollToElement(containerRef.current, focusRef.current, scrollAnimRef);
		}
	}, [focusRef.current, containerRef.current]);

	const mousemoveHandler = () => {
		setCursorFlag(true);
	};

	const keydownHandler = (e: KeyboardEvent) => {
		if (e.code === "ArrowUp") {
			setCursorFlag(false);
			focus.move(-1);
		}
		if (e.code === "ArrowDown") {
			setCursorFlag(false);
			focus.move(1);
		}
		if (e.code === "Enter" && focus.current) {
			const type = focus.current.type;
			switch (type) {
				case "expander": {
					focus.current.expand();
					break;
				}
				case "link": {
					const infoById = rowIdLinkMap.get(focus.current.id);
					if (infoById) {
						onLinkOpen({
							url: infoById.openSideEffect.params.pathname,
							searchFragmentInfo: infoById.openSideEffect.params.fragmentInfo,
							isRecommended: false,
						});
					}
					break;
				}
				case "temp": {
					break;
				}
				default:
					throw new Error(`Unexpected focus item type ${type}`);
			}
		}
	};

	useEffect(() => {
		document.addEventListener("keydown", keydownHandler, false);
		document.addEventListener("mousemove", mousemoveHandler, false);
		return () => {
			document.removeEventListener("keydown", keydownHandler, false);
			document.removeEventListener("mousemove", mousemoveHandler, false);
		};
	});

	return results.map((d) => (
		<div className="item" key={d.id} style={{ overflow: "hidden" }}>
			{/** biome-ignore lint/a11y/useKeyWithMouseEvents: div onMouseOver */}
			<div
				className={`item-title ${focus.current?.id === d.id ? "item-active" : ""}`}
				data-qa="qa-clickable"
				onMouseOver={() => {
					if (cursorFlag) focus.set(d.id);
				}}
			>
				<div>
					<Link
						className="flex item-center"
						href={d.url}
						onClick={() => {
							const title =
								d.type === "catalog"
									? d.rawResult.title.map((x) => x.text).join("")
									: d.rawResult.title.map((x) => x.text).join("");

							onLinkOpen({
								url: d.openSideEffect.params.pathname,
								searchFragmentInfo: d.openSideEffect.params.fragmentInfo,
								catalog: d.type === "catalog" ? undefined : d.rawResult.catalog?.title,
								title: title,
								isRecommended: d.type === "article" ? d.rawResult.isRecommended : false,
							});
						}}
						onMouseOver={() => {
							if (cursorFlag) focus.set(d.id);
						}}
						ref={focus.current?.id === d.id ? (focusRef as RefObject<HTMLAnchorElement>) : null}
					>
						{d.type === "article" ? (
							<span className="line-clamp-1 item-title-text">{getMarkElems(d.rawResult.title)}</span>
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
							className="breadcrumb-catalog"
							href={Url.from({
								pathname: d.rawResult.catalog.url,
							})}
							onClick={() =>
								onLinkOpen({
									url: d.openSideEffect.params.pathname,
									searchFragmentInfo: d.openSideEffect.params.fragmentInfo,
									catalog: d.rawResult.catalog?.title,
									title: d.rawResult.title.map((x) => x.text).join(""),
								})
							}
						>
							<BreadcrumbCatalog catalog={d.rawResult.catalog} variant={breadcrumbCatalogVariant} />
						</Link>
					)}

					{d.type === "article" && d.breadcrumbs && <LinksBreadcrumb readyData={d.breadcrumbs} />}
				</div>
				{d.type === "article" && d.rawResult.isRecommended && (
					<ArticlePropertyWrapper>
						<PropertyComponent
							icon={"star"}
							name={t("search.recommended")}
							propertyStyle={"blue"}
							shouldShowValue={false}
							style={{
								cursor: "default",
							}}
							type={PropertyTypes.flag}
							value={undefined}
						/>
					</ArticlePropertyWrapper>
				)}
			</div>
			{d.type === "article" &&
				getResultElems(
					d.items,
					(id) => {
						if (cursorFlag) focus.set(id);
					},
					onLinkOpen,
					focus.current,
					focusRef,
					d.rawResult.catalog.title,
					d.rawResult.title.map((x) => x.text).join(""),
					+d.id + 1,
				)}
		</div>
	));
};

const breadcrumbCatalogVariant = css`
  align-items: unset;

  .title {
    align-self: baseline;
    font-size: 12px;
  }
`;
