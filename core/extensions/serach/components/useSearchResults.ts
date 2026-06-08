import type { SearchFragmentInfo } from "@ext/serach/utils/ArticleFragmentCounter/ArticleFragmentCounter";
import {
	createLinkFocusItem,
	type ExpanderFocusItem,
	type FocusItem,
	FocusItemsCollector,
} from "@ext/serach/utils/FocusItemsCollector";
import type {
	RowArticleSearchResult,
	RowSearchResult,
	SearchItemRow,
	SearchItemRowId,
} from "@ext/serach/utils/SearchRowsModel";
import { useCallback, useMemo, useState } from "react";
import type { ArticleRow, ArticleRowExpanderItem, ArticleRowItem, ArticleRowParagraphItem, Row } from "./rowTypes";

const DEFAULT_SHOW_PARAGRAPH = 3;
const HIDDEN_EXPAND_COUNT = 5;

export interface UseSearchResultsArgs {
	rows: RowSearchResult[];
	focusItem: FocusItem | undefined;
	setFocusItem: (item: FocusItem) => void;
	onLinkOpen: (data: { url: string; searchFragmentInfo?: SearchFragmentInfo }) => void;
}

export interface UseSearchResultsResult {
	results: Row[];
	focus: {
		current: FocusItem | undefined;
		set: (id: SearchItemRowId | undefined) => void;
		move: (delta: number) => void;
	};
}

export const useSearchResults = ({
	rows,
	onLinkOpen,
	focusItem,
	setFocusItem,
}: UseSearchResultsArgs): UseSearchResultsResult => {
	const [showingMap, setShowingMap] = useState(new Map<SearchItemRowId, number>());

	const setShowing = useCallback(
		(id: SearchItemRowId, newValue: number) => {
			const newMap = new Map(showingMap);
			newMap.set(id, newValue);
			setShowingMap(newMap);
		},
		[showingMap],
	);

	const { results, focusableCollector } = useMemo(() => {
		const results: Row[] = [];
		const focusableCollector = new FocusItemsCollector();

		for (const row of rows) {
			const type = row.type;
			switch (type) {
				case "catalog": {
					results.push(row);
					focusableCollector.addLinkItem(row);
					break;
				}
				case "article": {
					focusableCollector.addLinkItem(row);
					const items = getArticleRowItems(
						row.id,
						row.items,
						showingMap,
						focusableCollector,
						setShowing,
						setFocusItem,
					);

					const item: ArticleRow = {
						...row,
						items,
						breadcrumbs: createArticleBreadcrumbs(row, onLinkOpen),
					};

					results.push(item);
					break;
				}
				default:
					throw new Error(`Unexpected search result row type ${type}`);
			}
		}

		return { results, focusableCollector };
	}, [rows, showingMap, onLinkOpen, setFocusItem, setShowing]);

	const setFocusId = useCallback(
		(id: SearchItemRowId | undefined) => {
			setFocusItem(id ? focusableCollector.get(id) : undefined);
		},
		[focusableCollector, setFocusItem],
	);

	const moveFocus = useCallback(
		(delta: number) => {
			if (!focusItem) return void setFocusItem(focusableCollector.first());

			if (focusItem.type === "temp") {
				setFocusItem(focusableCollector.getByIndex(focusItem.index + (delta > 0 ? delta - 1 : delta)));
				return;
			}

			setFocusItem(focusableCollector.get(focusItem.id, delta));
		},
		[focusItem, focusableCollector, setFocusItem],
	);

	return {
		results,
		focus: {
			current: focusItem,
			set: setFocusId,
			move: moveFocus,
		},
	};
};

function getArticleRowItems(
	parentId: SearchItemRowId,
	items: SearchItemRow[],
	showingMap: Map<SearchItemRowId, number>,
	focusableCollector: FocusItemsCollector,
	setShowing: (id: SearchItemRowId, count: number) => void,
	setFocusItem: (item: FocusItem) => void,
): ArticleRowItem[] {
	const addHiddenOrExpander = (
		res: ArticleRowItem[],
		paragraphCountBuffer: number,
		showing: number,
		expanderId: SearchItemRowId | undefined,
		hiddens: ArticleRowParagraphItem[],
	) => {
		if (hiddens.length === 1) {
			const firstHidden = hiddens[0];
			res.push(firstHidden);
			if (firstHidden.focusable) focusableCollector.addLinkItem(firstHidden);

			return true;
		}

		if (!expanderId) return false;
		if (paragraphCountBuffer <= showing) return false;
		const hiddenCount = paragraphCountBuffer - showing;
		const expander: ArticleRowExpanderItem | ExpanderFocusItem = {
			type: "expander",
			focusable: true,
			id: expanderId,
			count: hiddenCount,
			expand: () => {
				const newShowing = showing + HIDDEN_EXPAND_COUNT;
				const lastShowingItem =
					hiddens.length === HIDDEN_EXPAND_COUNT + 1
						? hiddens[hiddens.length - 1]
						: hiddens[Math.min(HIDDEN_EXPAND_COUNT, hiddens.length) - 1];
				setShowing(expanderId, newShowing);
				setFocusItem(
					lastShowingItem.focusable
						? createLinkFocusItem(lastShowingItem)
						: {
								type: "temp",
								id: lastShowingItem.id,
								index: focusableCollector.getIndex(expanderId),
							},
				);
			},
		};

		res.push(expander);
		focusableCollector.addItem(expander);
		return true;
	};

	const handleItemsRecursively = (parentId: SearchItemRowId, items: SearchItemRow[], singleBlockFocus: boolean) => {
		const res: ArticleRowItem[] = [];

		let paragraphCountBuffer = 0;
		let expanderId: SearchItemRowId | undefined;
		let showing = DEFAULT_SHOW_PARAGRAPH;
		let hiddens: ArticleRowParagraphItem[] = [];

		const resetParagraphGroup = () => {
			paragraphCountBuffer = 0;
			expanderId = undefined;
			showing = DEFAULT_SHOW_PARAGRAPH;
			hiddens = [];
		};

		const setParagraphGroupStart = (groupStartId: SearchItemRowId) => {
			expanderId = `${parentId}_expand_${groupStartId}`;
			showing = showingMap.get(expanderId) ?? DEFAULT_SHOW_PARAGRAPH;
		};

		items.forEach((item) => {
			const type = item.type;
			switch (type) {
				case "link": {
					const rowItem: ArticleRowParagraphItem = {
						...item,
						focusable: !singleBlockFocus,
					};
					if (paragraphCountBuffer === 0) setParagraphGroupStart(rowItem.id);
					paragraphCountBuffer++;

					if (paragraphCountBuffer > showing) {
						hiddens.push(rowItem);
						break;
					}

					if (!singleBlockFocus) focusableCollector.addLinkItem(item);

					res.push(rowItem);
					break;
				}
				case "block":
				case "file-block": {
					addHiddenOrExpander(res, paragraphCountBuffer, showing, expanderId, hiddens);
					resetParagraphGroup();

					if (!singleBlockFocus) focusableCollector.addLinkItem(item);

					res.push({
						...item,
						focusable: !singleBlockFocus,
						children: handleItemsRecursively(
							item.id,
							item.children,
							singleBlockFocus || item.type === "file-block",
						),
					});
					break;
				}
				case "diagram": {
					addHiddenOrExpander(res, paragraphCountBuffer, showing, expanderId, hiddens);
					resetParagraphGroup();

					if (!singleBlockFocus) focusableCollector.addLinkItem(item);

					res.push({
						...item,
						focusable: !singleBlockFocus,
						children: handleItemsRecursively(item.id, item.children, true),
					});
					break;
				}
				default:
					throw new Error(`Unexpected search result row item type ${type}`);
			}
		});

		addHiddenOrExpander(res, paragraphCountBuffer, showing, expanderId, hiddens);
		return res;
	};

	const res = handleItemsRecursively(parentId, items, false);
	return res;
}

function createArticleBreadcrumbs(
	row: RowArticleSearchResult,
	onLinkOpen: (data: { url: string; searchFragmentInfo?: SearchFragmentInfo }) => void,
) {
	const titles: ArticleRow["breadcrumbs"]["titles"] = [];
	const links: ArticleRow["breadcrumbs"]["links"] = [];
	const onClicks: ArticleRow["breadcrumbs"]["onClicks"] = [];

	row.rawResult.breadcrumbs.forEach((y) => {
		titles.push(y.title);
		links.push({ pathname: y.url });
		onClicks.push((e) => {
			e.stopPropagation();
			onLinkOpen({ url: y.url });
		});
	});

	return { titles, links, onClicks };
}
