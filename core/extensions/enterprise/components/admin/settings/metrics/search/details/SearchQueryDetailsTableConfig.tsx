import type { SortOrder } from "@ext/enterprise/components/admin/settings/metrics/filters";
import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";
import { SortableHeader, TruncatedText } from "../../view/table/TableHelpers";

export interface SearchQueryDetailRow {
	articleTitle: string;
	articleUrl: string;
	catalogName: string;
	isRecommended: boolean;
	clicks: number;
	ctr: number;
	avgPosition: number;
}

export type SearchQueryDetailSortByColumn =
	| "catalogName"
	| "articleTitle"
	| "isRecommended"
	| "clicks"
	| "ctr"
	| "avgPosition";

export interface SearchQueryDetailSortConfig {
	sortBy: SearchQueryDetailSortByColumn;
	sortOrder: SortOrder;
	onSortChange: (columnKey: SearchQueryDetailSortByColumn) => void;
}

export const createSearchQueryDetailsTableColumns = (
	sortConfig: SearchQueryDetailSortConfig,
): ColumnDef<SearchQueryDetailRow>[] => {
	const { sortBy, sortOrder, onSortChange } = sortConfig;
	return [
		{
			accessorKey: "catalogName",
			size: 150,
			header: () => (
				<SortableHeader<SearchQueryDetailSortByColumn>
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
				<SortableHeader<SearchQueryDetailSortByColumn>
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
						<TruncatedText className="text-left" text={row.original.articleTitle} />
					</a>
				</div>
			),
		},
		{
			accessorKey: "isRecommended",
			size: 100,
			header: () => (
				<SortableHeader<SearchQueryDetailSortByColumn>
					align="left"
					columnKey="isRecommended"
					currentSortBy={sortBy}
					label={t("metrics.table.pinned")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
				/>
			),
			cell: ({ row }) => (
				<div className="text-left">
					{row.original.isRecommended ? t("metrics.table.yes") : t("metrics.table.no")}
				</div>
			),
		},
		{
			accessorKey: "clicks",
			size: 100,
			header: () => (
				<SortableHeader<SearchQueryDetailSortByColumn>
					align="right"
					columnKey="clicks"
					currentSortBy={sortBy}
					label={t("metrics.table.clicks")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
				/>
			),
			cell: ({ row }) => <div className="text-right">{row.original.clicks.toLocaleString()}</div>,
		},
		{
			accessorKey: "ctr",
			size: 100,
			header: () => (
				<SortableHeader<SearchQueryDetailSortByColumn>
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
				<SortableHeader<SearchQueryDetailSortByColumn>
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
	];
};
