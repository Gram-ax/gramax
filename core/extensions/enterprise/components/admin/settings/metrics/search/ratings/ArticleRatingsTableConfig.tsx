import type { SortOrder } from "@ext/enterprise/components/admin/settings/metrics/filters";
import type { ArticleRatingRow } from "@ext/enterprise/components/admin/settings/metrics/types";
import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";
import { SortableHeader, TruncatedText } from "../../view/table/TableHelpers";

export type { ArticleRatingRow };

export interface ArticleRatingsResponse {
	data: ArticleRatingRow[];
	hasMore: boolean;
	nextCursor: string | null;
}

export type ArticleRatingSortByColumn =
	| "catalogName"
	| "articleTitle"
	| "searchCount"
	| "ctr"
	| "avgPosition"
	| "refinementRate";

export interface ArticleRatingSortConfig {
	sortBy: ArticleRatingSortByColumn;
	sortOrder: SortOrder;
	onSortChange: (columnKey: ArticleRatingSortByColumn) => void;
}

export const createArticleRatingsTableColumns = (
	sortConfig: ArticleRatingSortConfig,
): ColumnDef<ArticleRatingRow>[] => {
	const { sortBy, sortOrder, onSortChange } = sortConfig;
	return [
		{
			accessorKey: "catalogName",
			size: 150,
			header: () => (
				<SortableHeader<ArticleRatingSortByColumn>
					align="left"
					columnKey="catalogName"
					currentSortBy={sortBy}
					label={t("metrics.table.catalog")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
				/>
			),
			cell: ({ row }) => <TruncatedText className="text-left" text={row.original.catalogName} />,
		},
		{
			accessorKey: "articleTitle",
			size: 250,
			header: () => (
				<SortableHeader<ArticleRatingSortByColumn>
					align="left"
					columnKey="articleTitle"
					currentSortBy={sortBy}
					label={t("metrics.table.article")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
				/>
			),
			cell: ({ row }) => (
				<div className="text-left">
					<a
						className="text-blue-600 hover:underline"
						href={row.original.articleUrl}
						rel="noopener noreferrer"
						target="_blank"
					>
						<TruncatedText text={row.original.articleTitle} />
					</a>
				</div>
			),
		},
		{
			accessorKey: "searchCount",
			size: 120,
			header: () => (
				<SortableHeader<ArticleRatingSortByColumn>
					align="right"
					columnKey="searchCount"
					currentSortBy={sortBy}
					label={t("metrics.table.searches")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
				/>
			),
			cell: ({ row }) => <div className="text-right">{row.original.searchCount.toLocaleString()}</div>,
		},
		{
			accessorKey: "ctr",
			size: 100,
			header: () => (
				<SortableHeader<ArticleRatingSortByColumn>
					align="right"
					columnKey="ctr"
					currentSortBy={sortBy}
					label={t("metrics.table.ctr-percent")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
					tooltip={t("metrics.table.tooltips.ctr-percent")}
				/>
			),
			cell: ({ row }) => <div className="text-right">{Math.round(row.original.ctr)}%</div>,
		},
		{
			accessorKey: "avgPosition",
			size: 120,
			header: () => (
				<SortableHeader<ArticleRatingSortByColumn>
					align="right"
					columnKey="avgPosition"
					currentSortBy={sortBy}
					label={t("metrics.table.avg-position")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
					tooltip={t("metrics.table.tooltips.avg-click-position")}
				/>
			),
			cell: ({ row }) => <div className="text-right">{Math.ceil(row.original.avgPosition)}</div>,
		},
		{
			accessorKey: "refinementRate",
			size: 140,
			header: () => (
				<SortableHeader<ArticleRatingSortByColumn>
					align="right"
					columnKey="refinementRate"
					currentSortBy={sortBy}
					label={t("metrics.table.refinement-rate-percent")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
					tooltip={t("metrics.table.tooltips.refinement-rate-percent")}
				/>
			),
			cell: ({ row }) => <div className="text-right">{Math.round(row.original.refinementRate)}%</div>,
		},
	];
};
