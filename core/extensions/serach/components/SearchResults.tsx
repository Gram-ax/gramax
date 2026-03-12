import Link from "@components/Atoms/Link";
import LinksBreadcrumb from "@components/Breadcrumbs/LinksBreadcrumb";
import { useRouter } from "@core/Api/useRouter";
import Url from "@core-ui/ApiServices/Types/Url";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { css } from "@emotion/react";
import t from "@ext/localization/locale/translate";
import BreadcrumbCatalog from "@ext/serach/components/BreadcrumbCatalog";
import { CatalogResultItem } from "@ext/serach/components/CatalogResultItem";
import { getMarkElems, getResultElems } from "@ext/serach/components/searchUtils";
import { useSearchResults } from "@ext/serach/components/useSearchResults";
import { type CurrentScrollData, scrollToElement } from "@ext/serach/components/utils/scrollToElement";
import type { SearchFragmentInfo } from "@ext/serach/utils/ArticleFragmentCounter/ArticleFragmentCounter";
import type { FocusItem } from "@ext/serach/utils/FocusItemsCollector";
import type { RowSearchResult } from "@ext/serach/utils/SearchRowsModel";
import { Badge } from "@ui-kit/Badge";
import { type RefObject, useEffect, useRef } from "react";

export interface SearchResultsProps {
	rows: RowSearchResult[];
	searchAll: boolean;
	containerRef: RefObject<HTMLElement>;
	focusItem: FocusItem | undefined;
	setFocusItem: (item: FocusItem) => void;
	onLinkOpen: (data: { url: string; searchFragmentInfo?: SearchFragmentInfo }) => void;
	registerKeyHandler: (fn: ((e: React.KeyboardEvent) => boolean) | undefined) => void;
}

export const SearchResults = (props: SearchResultsProps) => {
	const { rows, searchAll, containerRef: listRef, onLinkOpen, focusItem, setFocusItem, registerKeyHandler } = props;

	const currentRefPath = ArticlePropsService.value?.ref.path;
	const focusRef = useRef<HTMLAnchorElement>(null);
	const scrollAnimRef = useRef<CurrentScrollData>({});
	const cursorFlagRef = useRef<boolean>(true);
	const router = useRouter();

	useEffect(() => {
		void rows;

		focusRef.current = null;
	}, [rows]);

	const { focus, results } = useSearchResults({
		rows,
		focusItem,
		setFocusItem,
		onLinkOpen,
	});

	useEffect(() => {
		void focus.current;

		if (!cursorFlagRef.current && focusRef.current && listRef.current) {
			scrollToElement(listRef.current, focusRef.current, scrollAnimRef);
		}
	}, [focus.current, listRef.current]);

	const mousemoveHandler = () => {
		cursorFlagRef.current = true;
	};

	const keyboardHandler = (e: React.KeyboardEvent) => {
		if (e.code === "ArrowUp") {
			cursorFlagRef.current = false;
			focus.move(-1);
			return true;
		}

		if (e.code === "ArrowDown") {
			cursorFlagRef.current = false;
			focus.move(1);
			return true;
		}

		if (e.code === "Enter" && focus.current) {
			const type = focus.current.type;
			switch (type) {
				case "expander": {
					focus.current.expand();
					break;
				}
				case "link": {
					router.setUrl(focus.current.url);
					onLinkOpen({
						url: focus.current.pathname,
						searchFragmentInfo: focus.current.fragmentInfo,
					});
					break;
				}
				case "temp": {
					break;
				}
				default:
					throw new Error(`Unexpected focus item type ${type}`);
			}

			return true;
		}

		return false;
	};

	useEffect(() => {
		registerKeyHandler(keyboardHandler);
		document.addEventListener("mousemove", mousemoveHandler, false);
		return () => {
			document.removeEventListener("mousemove", mousemoveHandler, false);
			registerKeyHandler(undefined);
		};
	});

	return results.map((d) => (
		<div
			className="item"
			key={d.id}
			onKeyDown={(e) => {
				if (keyboardHandler(e)) {
					e.preventDefault();
				}
			}}
			style={{ overflow: "hidden" }}
		>
			<div
				className={`item-title ${focus.current?.id === d.id ? "item-active" : ""}`}
				data-qa="qa-clickable"
				onClick={() => {
					router.setUrl(d.url);
					onLinkOpen({
						url: d.openSideEffect.params.pathname,
						searchFragmentInfo: d.openSideEffect.params.fragmentInfo,
					});
				}}
				onFocus={() => {
					if (!cursorFlagRef.current) focus.set(d.id);
				}}
				onMouseOver={() => {
					if (cursorFlagRef.current) focus.set(d.id);
				}}
			>
				{d.type === "article" && (d.rawResult.isRecommended || d.rawResult.refPath === currentRefPath) ? (
					<div className="item-title-badges">
						{d.rawResult.refPath === currentRefPath && (
							<Badge className="item-title-badge item-title-badge-current" size="sm">
								{t("search.current")}
							</Badge>
						)}
						{d.rawResult.isRecommended && (
							<Badge
								className="item-title-badge item-title-badge-recommended"
								size="sm"
								startIcon={"star"}
							>
								{t("search.recommended")}
							</Badge>
						)}
					</div>
				) : null}
				<div>
					<div className="item-title-content">
						<span
							className="flex item-center"
							ref={focus.current?.id === d.id ? (focusRef as RefObject<HTMLSpanElement>) : null}
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
						</span>

						{searchAll && d.type === "article" && (
							<Link
								className="breadcrumb-catalog"
								href={Url.from({
									pathname: d.rawResult.catalog.url,
								})}
								onClick={(e) => {
									e.stopPropagation();
									onLinkOpen({
										url: d.openSideEffect.params.pathname,
										searchFragmentInfo: d.openSideEffect.params.fragmentInfo,
									});
								}}
							>
								<BreadcrumbCatalog catalog={d.rawResult.catalog} variant={breadcrumbCatalogVariant} />
							</Link>
						)}

						{d.type === "article" && d.breadcrumbs && <LinksBreadcrumb readyData={d.breadcrumbs} />}
					</div>
				</div>
			</div>
			{d.type === "article" &&
				getResultElems(
					d.items,
					(id) => {
						if (cursorFlagRef.current) focus.set(id);
					},
					(id) => {
						if (!cursorFlagRef.current) focus.set(id);
					},
					onLinkOpen,
					focus.current,
					focusRef,
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
