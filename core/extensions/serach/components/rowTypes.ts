import type { LinksBreadcrumbProps } from "@components/Breadcrumbs/LinksBreadcrumb";
import type { ExpanderFocusItem } from "../utils/FocusItemsCollector";
import type {
	RowArticleSearchResult,
	RowCatalogSearchResult,
	SearchItemBlockRowBase,
	SearchItemLinkRow,
} from "../utils/SearchRowsModel";

export type Row = CatalogRow | ArticleRow;

export interface CatalogRow extends RowCatalogSearchResult {}

export interface ArticleRow extends Omit<RowArticleSearchResult, "items"> {
	breadcrumbs: LinksBreadcrumbProps["readyData"];
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

export interface ArticleRowExpanderItem extends ExpanderFocusItem, ArticleRowItemBase {}

export type ArticleRowItem =
	| ArticleRowBlockItem
	| ArticleRowFileBlockItem
	| ArticleRowParagraphItem
	| ArticleRowExpanderItem;
