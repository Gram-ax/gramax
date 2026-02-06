import Url from "@core-ui/ApiServices/Types/Url";
import type {
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
	type SearchFragmentInfo,
} from "@ext/serach/utils/ArticleFragmentCounter/ArticleFragmentCounter";

export type SearchItemRowId = string;

export interface LinkOpenSideEffectOptions {
	params: {
		pathname: string;
		fragmentInfo?: SearchFragmentInfo;
	};
}

export interface RowSearchResultBase {
	id: SearchItemRowId;
	url: Url;
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
	id: SearchItemRowId;
	openSideEffect: LinkOpenSideEffectOptions;
	url: Url;
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

export interface SearchItemLinkRow extends SearchItemRowBase {
	type: "link";
	marks: SearchResultMarkItem[];
}

export type SearchItemRow = SearchItemLinkRow | SearchItemBlockRow;

type BlockItemBase = Omit<SearchResultBlockItem, "type" | "embeddedLinkTitle" | "items">;

export interface HeaderBlockItem extends BlockItemBase {
	type: "header";
}

export interface FileBlockItem extends BlockItemBase {
	type: "file";
	fileName?: SearchResultMarkItem[];
}

export type BlockItem = HeaderBlockItem | FileBlockItem;

export class SearchItemRowIdGenerator {
	private id = 0;

	generateId(): SearchItemRowId {
		return (this.id++).toString();
	}
}

export type RowIdLinkMap = Map<SearchItemRowId, { url: Url; openSideEffect: LinkOpenSideEffectOptions }>;

export function buildArticleRows(searchData: SearchResult[]): { rows: RowSearchResult[]; rowIdLinkMap: RowIdLinkMap } {
	const rows: RowSearchResult[] = [];

	const rowIdLinkMap: RowIdLinkMap = new Map<
		SearchItemRowId,
		{ url: Url; openSideEffect: LinkOpenSideEffectOptions }
	>();
	const idGenerator = new SearchItemRowIdGenerator();

	for (const d of searchData) {
		const id = idGenerator.generateId();
		const href = createLinkRefUrl(d.url);
		const openSideEffect: LinkOpenSideEffectOptions = {
			params: {
				pathname: d.url,
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
					url: href,
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
					url: href,
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

				const href = createLinkRefUrl(baseUrl, fragmentInfo);
				const openSideEffect: LinkOpenSideEffectOptions = {
					params: {
						pathname: baseUrl,
						fragmentInfo,
					},
				};

				const id = idGenerator.generateId();
				if (!overrideFragmentInfo) {
					rowIdLinkMap.set(id, { url: href, openSideEffect });
				}

				res.push({
					type: "link",
					id,
					url: href,
					marks: item.items,
					openSideEffect,
				});
			};

			if (item.type === "paragraph") {
				handleParagraph(item, (text) => articleFragmentCounter.initFragmentInfo(text));
			} else if (item.type === "paragraph_group") {
				let linkInfoForWholeGroup: SearchFragmentInfo | undefined;
				item.paragraphs.forEach((p) => {
					handleParagraph(p, (text) => {
						if (linkInfoForWholeGroup === undefined)
							linkInfoForWholeGroup = articleFragmentCounter.initFragmentInfo(text);
						return linkInfoForWholeGroup;
					});
				});
			} else if (item.type === "block") {
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
				const id = idGenerator.generateId();
				const openSideEffect: LinkOpenSideEffectOptions = {
					params: {
						pathname: baseUrl,
						fragmentInfo,
					},
				};

				if (!overrideFragmentInfo) {
					rowIdLinkMap.set(id, { url: href, openSideEffect });
				}

				res.push({
					type,
					id,
					url: href,
					breadcrumbs,
					children: handleItemsRecursively(curRawItem.items, overrideFragmentInfoForChildren),
					openSideEffect,
				});
			}
		});

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
