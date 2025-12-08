import { SearchResultMarkItem, SearchResultBlockItem } from "@ext/serach/Searcher";
import { Fragment } from "react";
import Link from "../../Atoms/Link";
import { SearchItemRow } from "./SearchRowsModel";

export const getMarkElems = (marks: SearchResultMarkItem[]) => {
	return marks.map((mark, index) => (
		<Fragment key={index}>
			{mark.type === "highlight" ? <strong className="match">{mark.text}</strong> : mark.text}
		</Fragment>
	));
};

export const getBlockMarkElems = (t: SearchResultBlockItem) => {
	if (t.embeddedLinkTitle != null) {
		const titleText = t.title
			.map((x) => x.text)
			.join("")
			.trim();
		const embTitleText = t.embeddedLinkTitle
			.map((x) => x.text)
			.join("")
			.trim();

		if (embTitleText.length === 0 || embTitleText === titleText) {
			return <span className="gr-file">{getMarkElems(t.title)}</span>;
		} else {
			return (
				<Fragment>
					{getMarkElems(t.title)}
					{<span className="gr-file">{getMarkElems(t.embeddedLinkTitle)}</span>}
				</Fragment>
			);
		}
	} else {
		return getMarkElems(t.title);
	}
};

export function getResultElems(
	items: SearchItemRow[],
	onLinkOver: (id: number) => void,
	focusId: number | null,
	focusRef: React.RefObject<HTMLElement>,
) {
	const res: React.JSX.Element[] = [];

	items.forEach((item) => {
		if (item.type === "link") {
			res.push(
				<Fragment key={item.id ?? item.key}>
					<Link
						onClick={item.onClick}
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
		} else if (item.type === "block") {
			const highlightWholeBlock = item.embeddedLinkTitle != null;
			res.push(
				<div
					key={item.id ?? item.key}
					className={highlightWholeBlock && focusId === item.id ? "item-active" : ""}
					onMouseOver={highlightWholeBlock ? () => onLinkOver(item.id) : undefined}
				>
					{item.hiddenText}
					<Link
						onClick={item.onClick}
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
									{getBlockMarkElems(x)}
								</Fragment>
							))}
						</div>
					</Link>
					<div style={{ paddingLeft: `10px` }}>
						{getResultElems(item.children, onLinkOver, focusId, focusRef)}
					</div>
				</div>,
			);
		} else if (item.type === "message") {
			res.push(
				//TODO: set key for message
				<Fragment key={Math.random()}>
					<div className="excerpt" data-qa="qa-clickable">
						<span className="cut-content hidden-count-info">{item.textContent}</span>
					</div>
				</Fragment>,
			);
		}
	});

	return res;
}
