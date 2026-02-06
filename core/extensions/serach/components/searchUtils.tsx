import Link from "@components/Atoms/Link";
import t from "@ext/localization/locale/translate";
import type { SearchResultMarkItem } from "@ext/serach/Searcher";
import type { FocusItem } from "@ext/serach/utils/FocusItemsCollector";
import type { BlockItem, SearchItemRowId } from "@ext/serach/utils/SearchRowsModel";
import { Fragment, type RefObject } from "react";
import type { SearchFragmentInfo } from "../utils/ArticleFragmentCounter/ArticleFragmentCounter";
import type { ArticleRowItem } from "./rowTypes";

export const getMarkElems = (marks: SearchResultMarkItem[]) => {
	return marks.map((mark, index) => (
		<Fragment key={`${mark.type}-${index}`}>
			{mark.type === "highlight" ? <strong className="match">{mark.text}</strong> : mark.text}
		</Fragment>
	));
};

const getBlockMarkElems = (item: BlockItem) => {
	if (item.type === "header") return getMarkElems(item.title);

	const title = (
		<span className="gr-file">
			<span className="gr-file-title">{getMarkElems(item.title)}</span>
		</span>
	);

	let trueFileName: React.JSX.Element;

	if (item.fileName != null) {
		trueFileName = <span className="file-true-name">{getMarkElems(item.fileName)}</span>;
	}

	return (
		<div className="file-block-title">
			{title}
			{trueFileName}
		</div>
	);
};

export function getResultElems(
	items: ArticleRowItem[],
	onLinkOver: (id: SearchItemRowId) => void,
	onLinkOpen: (
		articleInfo: {
			url: string;
			searchFragmentInfo?: SearchFragmentInfo;
			title?: string;
			catalog?: string;
			isRecommended?: boolean;
		},
		clickPosition?: number,
	) => void,
	focusItem: FocusItem | undefined,
	focusRef: React.RefObject<HTMLElement>,
	catalog: string,
	title: string,
	clickPosition?: number,
) {
	const res: React.JSX.Element[] = [];

	items.forEach((item) => {
		const isRef = focusItem?.id === item.id;
		const isActive = focusItem?.type !== "temp" && isRef;
		if (item.type === "link") {
			res.push(
				<Fragment key={item.id}>
					<Link
						href={item.url}
						onClick={() =>
							onLinkOpen(
								{
									url: item.openSideEffect.params.pathname,
									searchFragmentInfo: item.openSideEffect.params.fragmentInfo,
									catalog,
									title: item.openSideEffect.params.fragmentInfo.text,
								},
								clickPosition,
							)
						}
						onFocus={item.id ? () => onLinkOver(item.id) : undefined}
						onMouseOver={() => onLinkOver(item.id)}
						ref={isRef ? (focusRef as React.RefObject<HTMLAnchorElement>) : undefined}
					>
						<div className={`excerpt ${isActive ? "item-active" : ""}`} data-qa="qa-clickable">
							<span className="cut-content">{getMarkElems(item.marks)}</span>
						</div>
					</Link>
				</Fragment>,
			);
		} else if (item.type === "block" || item.type === "file-block") {
			const highlightWholeBlock = item.type === "file-block";
			res.push(
				// biome-ignore lint/a11y/useKeyWithMouseEvents: div onFocus
				<div
					className={highlightWholeBlock && isActive ? "item-active" : ""}
					key={item.id}
					onMouseOver={highlightWholeBlock ? () => onLinkOver(item.id) : undefined}
				>
					<Link
						href={item.url}
						onClick={() =>
							onLinkOpen(
								{
									url: item.openSideEffect.params.pathname,
									searchFragmentInfo: item.openSideEffect.params.fragmentInfo,
								},
								clickPosition,
							)
						}
						onFocus={() => onLinkOver(item.id)}
						onMouseOver={!highlightWholeBlock ? () => onLinkOver(item.id) : undefined}
						ref={isRef ? (focusRef as React.RefObject<HTMLAnchorElement>) : undefined}
					>
						<div
							className={`excerpt article-header ${isActive ? "item-active" : ""}`}
							data-qa="qa-clickable"
						>
							{item.breadcrumbs.map((x, i) => (
								<Fragment key={`${x.type}-${i}`}>
									{i > 0 ? <span className="breadcrumbs-separator">/</span> : null}
									<span>{getBlockMarkElems(x)}</span>
								</Fragment>
							))}
						</div>
					</Link>
					<div style={{ paddingLeft: `15px` }}>
						{getResultElems(
							item.children,
							onLinkOver,
							onLinkOpen,
							focusItem,
							focusRef,
							catalog,
							title,
							clickPosition,
						)}
					</div>
				</div>,
			);
		} else if (item.type === "expander") {
			res.push(
				<Fragment key={item.id}>
					{/** biome-ignore lint/a11y/useKeyWithMouseEvents: div onFocus */}
					<div
						className={`hidden-count-info ${isActive ? "item-active" : ""}`}
						onClick={() => item.expand()}
						onMouseOver={(e) => {
							onLinkOver(item.id);
							e.stopPropagation();
						}}
						ref={isRef ? (focusRef as RefObject<HTMLDivElement>) : undefined}
					>
						{getHiddenCountText(item.count)}
					</div>
				</Fragment>,
			);
		}
	});

	return res;
}

function getHiddenCountText(count: number): string {
	let hiddenText = t("search.hidden-results");
	if (typeof hiddenText === "string") {
		hiddenText = hiddenText.replace("{{count}}", String(count));
	}

	return hiddenText;
}
