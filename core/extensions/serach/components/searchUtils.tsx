import Link from "@components/Atoms/Link";
import { SearchResultMarkItem } from "@ext/serach/Searcher";
import { BlockItem, SearchItemRow } from "@ext/serach/utils/SearchRowsModel";
import { Fragment } from "react";
import { SearchFragmentInfo } from "../utils/ArticleFragmentCounter/ArticleFragmentCounter";

export const getMarkElems = (marks: SearchResultMarkItem[]) => {
	return marks.map((mark, index) => (
		<Fragment key={index}>
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
	items: SearchItemRow[],
	onLinkOver: (id: number) => void,
	onLinkOpen: (url: string, fragmentInfo?: SearchFragmentInfo) => void,
	focusId: number | null,
	focusRef: React.RefObject<HTMLElement>,
) {
	const res: React.JSX.Element[] = [];

	items.forEach((item) => {
		if (item.type === "link") {
			res.push(
				<Fragment key={item.id ?? item.key}>
					<Link
						onClick={() =>
							onLinkOpen(item.openSideEffect.params.url, item.openSideEffect.params.fragmentInfo)
						}
						href={item.href}
						onMouseOver={item.id ? () => onLinkOver(item.id) : undefined}
						ref={focusId === item.id ? (focusRef as React.RefObject<HTMLAnchorElement>) : undefined}
					>
						<div className={`excerpt ${focusId === item.id ? "item-active" : ""}`} data-qa="qa-clickable">
							<span className="cut-content">{getMarkElems(item.marks)}</span>
						</div>
					</Link>
				</Fragment>,
			);
		} else if (item.type === "block" || item.type === "file-block") {
			const highlightWholeBlock = item.type === "file-block";
			res.push(
				<div
					key={item.id ?? item.key}
					className={highlightWholeBlock && focusId === item.id ? "item-active" : ""}
					onMouseOver={highlightWholeBlock ? () => onLinkOver(item.id) : undefined}
				>
					<Link
						onClick={() =>
							onLinkOpen(item.openSideEffect.params.url, item.openSideEffect.params.fragmentInfo)
						}
						href={item.href}
						onMouseOver={!highlightWholeBlock ? () => onLinkOver(item.id) : undefined}
						ref={focusId === item.id ? (focusRef as React.RefObject<HTMLAnchorElement>) : undefined}
					>
						<div
							className={`excerpt article-header ${focusId === item.id ? "item-active" : ""}`}
							data-qa="qa-clickable"
						>
							{item.breadcrumbs.map((x, i) => (
								<Fragment key={i}>
									{i > 0 ? <span className="breadcrumbs-separator">/</span> : null}
									<span>{getBlockMarkElems(x)}</span>
								</Fragment>
							))}
						</div>
					</Link>
					<div style={{ paddingLeft: `15px` }}>
						{getResultElems(item.children, onLinkOver, onLinkOpen, focusId, focusRef)}
					</div>
				</div>,
			);
		} else if (item.type === "message") {
			res.push(
				//TODO: set key for message
				<Fragment key={Math.random()}>
					<div className="hidden-count-info">{item.textContent}</div>
				</Fragment>,
			);
		}
	});

	return res;
}
