import type { LinksBreadcrumbReadyData } from "@components/Breadcrumbs/LinksBreadcrumb";
import type { SearchResultMarkItem } from "@ext/serach/Searcher";
import type { ExpanderFocusItem } from "../utils/FocusItemsCollector";
import type {
	RowArticleSearchResult,
	RowCatalogSearchResult,
	SearchItemBlockRowBase,
	SearchItemDiagramRow,
	SearchItemLinkRow,
} from "../utils/SearchRowsModel";

export type Row = CatalogRow | ArticleRow;

export interface CatalogRow extends RowCatalogSearchResult {}

export interface ArticleRow extends Omit<RowArticleSearchResult, "items"> {
	breadcrumbs: LinksBreadcrumbReadyData<SearchResultMarkItem[]>;
	items: ArticleRowItem[];
}

export interface ArticleRowItemBase {
	focusable: boolean;
}

export interface ArticleRowBlockItemBase extends Omit<SearchItemBlockRowBase, "children">, ArticleRowItemBase {
	children: ArticleRowItem[];
}

export interface ArticleRowHeaderBlockItem extends ArticleRowBlockItemBase {
	type: "block";
}

export interface ArticleRowFileBlockItem extends ArticleRowBlockItemBase {
	type: "file-block";
}

export type ArticleRowBlockItem = ArticleRowHeaderBlockItem | ArticleRowFileBlockItem;

export interface ArticleRowParagraphItem extends SearchItemLinkRow, ArticleRowItemBase {}

export interface ArticleRowDiagramItem extends Omit<SearchItemDiagramRow, "children">, ArticleRowItemBase {
	children: ArticleRowItem[];
}

export interface ArticleRowExpanderItem extends ExpanderFocusItem, ArticleRowItemBase {}

export type ArticleRowItem =
	| ArticleRowBlockItem
	| ArticleRowFileBlockItem
	| ArticleRowParagraphItem
	| ArticleRowDiagramItem
	| ArticleRowExpanderItem;
