import {
	SearchArticleResult,
	SearchCatalogResult,
	SearchResult,
	SearchResultBlockItem,
	SearchResultItem,
	SearchResultMarkItem,
	SearchResultParagraphItem,
} from "@ext/serach/Searcher";
import t from "../../../extensions/localization/locale/translate";
import Url from "../../../ui-logic/ApiServices/Types/Url";
import { ArticleFragmentCounter, SearchFragmentInfo } from "./ArticleFragmentCounter/ArticleFragmentCounter";

export interface RowSearchResultBase {
	id: number;
	href?: Url;
	onClick?: () => void;
}

export interface RowArticleSearchResult extends RowSearchResultBase {
	type: "article";
	rawResult: SearchArticleResult;
	items: SearchItemRow[];
}

export interface RowCatalogSearchResult extends RowSearchResultBase {
	type: "catalog";
	rawResult: SearchCatalogResult;
}

export type RowSearchResult = RowArticleSearchResult | RowCatalogSearchResult;

export type SearchItemBlockRow = {
	type: "block";
	embeddedLinkTitle?: SearchResultMarkItem[];
	href: Url;
	hiddenText?: string;
	children: SearchItemRow[];
	onClick: () => void;
	breadcrumbs: SearchResultBlockItem[];
	id?: number;
	key?: string;
};

export type SearchItemRow =
	| {
			type: "link";
			href: Url;
			marks: SearchResultMarkItem[];
			id?: number;
			key?: string;
			onClick: () => void;
	  }
	| { type: "message"; textContent: string }
	| SearchItemBlockRow;

class SearchItemRowIdGenerator {
	private id = 0;

	generateId(): number {
		return this.id++;
	}
}

export type RowIdLinkMap = Map<number, { url: Url; onLinkOpen: () => void }>;

const MAX_SHOW_PARAGRAPH = 3;

export function buildArticleRows(
	searchData: SearchResult[],
	onLinkClick: (url: string, fragmentInfo?: SearchFragmentInfo) => void,
): { rows: RowSearchResult[]; rowIdLinkMap: RowIdLinkMap } {
	const rows: RowSearchResult[] = [];

	const rowIdLinkMap: RowIdLinkMap = new Map<number, { url: Url; onLinkOpen: () => void }>();
	const idGenerator = new SearchItemRowIdGenerator();

	for (const d of searchData) {
		const id = idGenerator.generateId();
		const href = createLinkRefUrl(d.url);
		const onLinkOpen = () => onLinkClick(d.url);
		rowIdLinkMap.set(id, { url: href, onLinkOpen });

		const type = d.type;
		switch (type) {
			case "article": {
				rows.push({
					type: "article",
					id,
					rawResult: d,
					href,
					onClick: onLinkOpen,
					items: getSearchRows(d.items, d.url, idGenerator, rowIdLinkMap, onLinkClick),
				});
				break;
			}
			case "catalog": {
				rows.push({
					type: "catalog",
					id,
					rawResult: d,
					href,
					onClick: onLinkOpen,
				});
				break;
			}
			default:
				throw new Error(`Unexpected search result type ${type}`);
		}
	}

	return { rows, rowIdLinkMap };
}

function createLinkRefUrl(baseUrl: string, fragmentInfo?: SearchFragmentInfo) {
	const url = Url.from({ pathname: baseUrl });

	if (fragmentInfo) {
		url.query = {};
		url.query.highlightFragment = fragmentInfo.text;
		url.query.highlightFragmentIndex = fragmentInfo.indexInArticle.toString();
	}

	return url;
}

function getSearchRows(
	items: SearchResultItem[],
	baseUrl: string,
	idGenerator: SearchItemRowIdGenerator,
	rowIdLinkMap: RowIdLinkMap,
	onLinkClick: (url: string, fragmentInfo?: SearchFragmentInfo) => void,
): SearchItemRow[] {
	const articleFragmentCounter = new ArticleFragmentCounter();

	const handleItemsRecursively = (items: SearchResultItem[], overrideFragmentInfo?: SearchFragmentInfo) => {
		const res: SearchItemRow[] = [];
		let paragraphCountBuffer = 0;

		items.forEach((item, i) => {
			const handleParagraph = (
				item: SearchResultParagraphItem,
				getLinkInfo: (text: string) => SearchFragmentInfo,
			) => {
				let fragmentInfo: SearchFragmentInfo | undefined = overrideFragmentInfo;

				if (!fragmentInfo) {
					let linkFragment = item.items.map((i) => i.text).join("");
					if (linkFragment) {
						if (linkFragment.startsWith("...")) linkFragment = linkFragment.slice(3);
						if (linkFragment.endsWith("...")) linkFragment = linkFragment.slice(0, -3);
						fragmentInfo = getLinkInfo(linkFragment);
					}
				}

				paragraphCountBuffer++;
				if (paragraphCountBuffer > MAX_SHOW_PARAGRAPH) {
					return;
				}

				const href = createLinkRefUrl(baseUrl, fragmentInfo);
				const onLinkOpen = () => onLinkClick(baseUrl, fragmentInfo);

				let id: number | undefined = undefined;
				let key: string | undefined = undefined;
				if (!overrideFragmentInfo) {
					id = idGenerator.generateId();
					rowIdLinkMap.set(id, { url: href, onLinkOpen });
				} else key = Math.random().toString();

				res.push({
					type: "link",
					marks: item.items,
					href,
					key,
					id,
					onClick: onLinkOpen,
				});
			};

			if (item.type === "paragraph") {
				handleParagraph(item, (text) => articleFragmentCounter.initFragmentInfo(text));
			} else if (item.type === "paragraph_group") {
				let linkInfoForWholeGroup: SearchFragmentInfo | undefined = undefined;
				item.paragraphs.forEach((p) => {
					handleParagraph(p, (text) => {
						if (linkInfoForWholeGroup === undefined)
							linkInfoForWholeGroup = articleFragmentCounter.initFragmentInfo(text);
						return linkInfoForWholeGroup;
					});
				});
			} else if (item.type === "block") {
				let hiddenText: string | undefined = undefined;
				if (paragraphCountBuffer > MAX_SHOW_PARAGRAPH) {
					const hiddenCount = paragraphCountBuffer - MAX_SHOW_PARAGRAPH;
					hiddenText = t("search.hidden-results");
					if (typeof hiddenText === "string") {
						hiddenText = hiddenText.replace("{{count}}", String(hiddenCount));
					}
				}

				paragraphCountBuffer = 0;

				const breadcrumbs: SearchResultBlockItem[] = [item];
				let cur = item;
				while (cur.items.length === 1 && cur.items[0].type === "block") {
					cur = cur.items[0];
					breadcrumbs.push(cur);
				}

				let fragmentInfo: SearchFragmentInfo | undefined = overrideFragmentInfo;
				if (!fragmentInfo && cur.title.length > 0) {
					const joinedTitle = cur.title.map((x) => x.text).join("");
					fragmentInfo = articleFragmentCounter.initFragmentInfo(joinedTitle);
				}

				let overrideFragmentInfoForChildren: SearchFragmentInfo | undefined = undefined;
				if (overrideFragmentInfo) overrideFragmentInfoForChildren = overrideFragmentInfo;
				else if (item.embeddedLinkTitle) overrideFragmentInfoForChildren = fragmentInfo;

				const href = createLinkRefUrl(baseUrl, fragmentInfo);
				let id: number | undefined = undefined;
				let key: string | undefined = undefined;
				const onLinkOpen = () => onLinkClick(baseUrl, fragmentInfo);
				if (!overrideFragmentInfo) {
					id = idGenerator.generateId();
					rowIdLinkMap.set(id, { url: href, onLinkOpen });
				} else key = Math.random().toString();

				res.push({
					type: "block",
					id,
					key,
					hiddenText,
					href,
					embeddedLinkTitle: item.embeddedLinkTitle,
					breadcrumbs,
					children: handleItemsRecursively(cur.items, overrideFragmentInfoForChildren),
					onClick: onLinkOpen,
				});
			}
		});

		if (paragraphCountBuffer > MAX_SHOW_PARAGRAPH) {
			const hiddenCount = paragraphCountBuffer - MAX_SHOW_PARAGRAPH;
			let hiddenText = t("search.hidden-results");
			if (typeof hiddenText === "string") {
				hiddenText = hiddenText.replace("{{count}}", String(hiddenCount));
			}
			res.push({
				type: "message",
				textContent: hiddenText,
			});
		}

		return res;
	};

	return handleItemsRecursively(items);
}
