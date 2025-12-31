import Url from "@core-ui/ApiServices/Types/Url";
import t from "@ext/localization/locale/translate";
import {
	SearchArticleResult,
	SearchCatalogResult,
	SearchResult,
	SearchResultBlockItem,
	SearchResultItem,
	SearchResultMarkItem,
	SearchResultParagraphItem,
} from "@ext/serach/Searcher";
import {
	ArticleFragmentCounter,
	SearchFragmentInfo,
} from "@ext/serach/utils/ArticleFragmentCounter/ArticleFragmentCounter";

interface LinkOpenSideEffectOptions {
	params: {
		url: string;
		fragmentInfo?: SearchFragmentInfo;
	};
}

export interface RowSearchResultBase {
	id: number;
	href?: Url;
	openSideEffect: LinkOpenSideEffectOptions;
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

export interface SearchItemRowBase {
	id?: number;
	key?: string;
	openSideEffect: LinkOpenSideEffectOptions;
	href: Url;
}

export interface SearchItemBlockRowBase extends SearchItemRowBase {
	children: SearchItemRow[];
	breadcrumbs: BlockItem[];
}

export interface SearchItemHeaderBlockRow extends SearchItemBlockRowBase {
	type: "block";
}

export interface SearchItemFileBlockRow extends SearchItemBlockRowBase {
	type: "file-block";
}

export type SearchItemBlockRow = SearchItemHeaderBlockRow | SearchItemFileBlockRow;

export interface SearchItemMessageRow {
	type: "message";
	textContent: string;
}

export interface SearchItemLinkRow extends SearchItemRowBase {
	type: "link";
	marks: SearchResultMarkItem[];
}

export type SearchItemRow = SearchItemLinkRow | SearchItemMessageRow | SearchItemBlockRow;

type BlockItemBase = Omit<SearchResultBlockItem, "type" | "embeddedLinkTitle" | "items">;

export interface HeaderBlockItem extends BlockItemBase {
	type: "header";
}

export interface FileBlockItem extends BlockItemBase {
	type: "file";
	fileName?: SearchResultMarkItem[];
}

export type BlockItem = HeaderBlockItem | FileBlockItem;

class SearchItemRowIdGenerator {
	private id = 0;

	generateId(): number {
		return this.id++;
	}
}

export type RowIdLinkMap = Map<number, { url: Url; openSideEffect: LinkOpenSideEffectOptions }>;

const MAX_SHOW_PARAGRAPH = 3;

export function buildArticleRows(searchData: SearchResult[]): { rows: RowSearchResult[]; rowIdLinkMap: RowIdLinkMap } {
	const rows: RowSearchResult[] = [];

	const rowIdLinkMap: RowIdLinkMap = new Map<number, { url: Url; openSideEffect: LinkOpenSideEffectOptions }>();
	const idGenerator = new SearchItemRowIdGenerator();

	for (const d of searchData) {
		const id = idGenerator.generateId();
		const href = createLinkRefUrl(d.url);
		const openSideEffect: LinkOpenSideEffectOptions = {
			params: {
				url: d.url,
			},
		};
		rowIdLinkMap.set(id, { url: href, openSideEffect });

		const type = d.type;
		switch (type) {
			case "article": {
				rows.push({
					type: "article",
					id,
					rawResult: d,
					href,
					openSideEffect,
					items: getSearchRows(d.items, d.url, idGenerator, rowIdLinkMap),
				});
				break;
			}
			case "catalog": {
				rows.push({
					type: "catalog",
					id,
					rawResult: d,
					href,
					openSideEffect,
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
): SearchItemRow[] {
	const articleFragmentCounter = new ArticleFragmentCounter();

	const handleItemsRecursively = (items: SearchResultItem[], overrideFragmentInfo?: SearchFragmentInfo) => {
		const res: SearchItemRow[] = [];
		let paragraphCountBuffer = 0;

		items.forEach((item) => {
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
				const openSideEffect: LinkOpenSideEffectOptions = {
					params: {
						url: baseUrl,
						fragmentInfo,
					},
				};

				let id: number | undefined = undefined;
				let key: string | undefined = undefined;
				if (!overrideFragmentInfo) {
					id = idGenerator.generateId();
					rowIdLinkMap.set(id, { url: href, openSideEffect });
				} else key = Math.random().toString();

				res.push({
					type: "link",
					marks: item.items,
					href,
					key,
					id,
					openSideEffect,
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
				paragraphCountBuffer = tryAddHiddenCountRow(res, paragraphCountBuffer);

				let fragmentInfo: SearchFragmentInfo | undefined = overrideFragmentInfo;
				let overrideFragmentInfoForChildren: SearchFragmentInfo | undefined = overrideFragmentInfo;
				let type: SearchItemBlockRow["type"] = "block";

				const newFragmentInfo = (block: BlockItem) => {
					const joinedTitle = block.title.map((x) => x.text).join("");
					fragmentInfo = articleFragmentCounter.initFragmentInfo(joinedTitle);
				};

				const handleFileBlock = (block: BlockItem): void => {
					if (type === "block" && !overrideFragmentInfo && block.title.length > 0) {
						newFragmentInfo(block);
					}

					if (block.type === "file") {
						type = "file-block";
						if (!overrideFragmentInfo) {
							overrideFragmentInfoForChildren = fragmentInfo;
						}
					}
				};

				const rootBlockItem = getBlockItem(item);
				const breadcrumbs: BlockItem[] = [rootBlockItem];
				let curRawItem = item;
				let curBlockItem = rootBlockItem;
				handleFileBlock(curBlockItem);
				while (curRawItem.items.length === 1 && curRawItem.items[0].type === "block") {
					curRawItem = curRawItem.items[0];
					curBlockItem = getBlockItem(curRawItem);
					handleFileBlock(curBlockItem);
					breadcrumbs.push(curBlockItem);
				}

				const href = createLinkRefUrl(baseUrl, fragmentInfo);
				let id: number | undefined = undefined;
				let key: string | undefined = undefined;
				const openSideEffect: LinkOpenSideEffectOptions = {
					params: {
						url: baseUrl,
						fragmentInfo,
					},
				};
				if (!overrideFragmentInfo) {
					id = idGenerator.generateId();
					rowIdLinkMap.set(id, { url: href, openSideEffect });
				} else key = Math.random().toString();

				res.push({
					type,
					id,
					key,
					href,
					breadcrumbs,
					children: handleItemsRecursively(curRawItem.items, overrideFragmentInfoForChildren),
					openSideEffect,
				});
			}
		});

		paragraphCountBuffer = tryAddHiddenCountRow(res, paragraphCountBuffer);
		return res;
	};

	return handleItemsRecursively(items);
}

function getBlockItem(item: SearchResultBlockItem): BlockItem {
	if (item.embeddedLinkTitle) {
		const titleText = item.title
			.map((x) => x.text)
			.join("")
			.trim();
		const embTitleText = item.embeddedLinkTitle
			.map((x) => x.text)
			.join("")
			.trim();

		const result: FileBlockItem = {
			type: "file",
			title: item.title,
		};

		if (embTitleText.length !== 0 && embTitleText !== titleText) {
			result.fileName = item.embeddedLinkTitle;
		}

		return result;
	}

	return {
		type: "header",
		title: item.title,
	};
}

function tryAddHiddenCountRow(rows: SearchItemRow[], paragraphCountBuffer: number): number {
	if (paragraphCountBuffer > MAX_SHOW_PARAGRAPH) {
		rows.push(getHiddenCountRow(paragraphCountBuffer - MAX_SHOW_PARAGRAPH));
		return 0;
	}

	return paragraphCountBuffer;
}

function getHiddenCountRow(count: number): SearchItemMessageRow {
	let hiddenText = t("search.hidden-results");
	if (typeof hiddenText === "string") {
		hiddenText = hiddenText.replace("{{count}}", String(count));
	}

	return {
		type: "message",
		textContent: hiddenText,
	};
}
