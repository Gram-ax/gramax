import type { SearchSortByColumn, SortOrder } from "@ext/enterprise/components/admin/settings/metrics/filters";
import t from "@ext/localization/locale/translate";
import type { ColumnDef } from "@ui-kit/DataTable";
import { SortableHeader, TruncatedText } from "../../view/table/TableHelpers";

export interface SearchMetricsTableRow {
	id: string; // Use normalizedQuery as id
	normalizedQuery: string;
	searchCount: number;
	uniqueVisitors: number;
	ctrPercent: number;
	mostClickedTitle: string | null;
	mostClickedUrl: string | null;
	mostClickedCatalog: string | null;
	avgClickPosition: number;
	refinementPercent: number;
}

export interface SearchTableDataResponse {
	data: SearchMetricsTableRow[];
	nextCursor: string | null;
	hasMore: boolean;
}

export interface SearchSortConfig {
	sortBy: SearchSortByColumn;
	sortOrder: SortOrder;
	onSortChange: (columnKey: SearchSortByColumn) => void;
}

export const createSearchMetricsTableColumns = (sortConfig: SearchSortConfig): ColumnDef<SearchMetricsTableRow>[] => {
	const { sortBy, sortOrder, onSortChange } = sortConfig;

	return [
		{
			accessorKey: "normalizedQuery",
			size: 250,
			header: () => (
				<SortableHeader<SearchSortByColumn>
					align="left"
					columnKey="query"
					currentSortBy={sortBy}
					label={t("metrics.table.search-query")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
				/>
			),
			cell: ({ row }) => <TruncatedText className="text-left" text={row.original.normalizedQuery} />,
		},
		{
			accessorKey: "searchCount",
			size: 120,
			header: () => (
				<SortableHeader<SearchSortByColumn>
					align="right"
					columnKey="searchCount"
					currentSortBy={sortBy}
					label={t("metrics.table.search-count")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
				/>
			),
			cell: ({ row }) => <div className="text-right">{row.original.searchCount.toLocaleString()}</div>,
		},
		{
			accessorKey: "uniqueVisitors",
			size: 140,
			header: () => (
				<SortableHeader<SearchSortByColumn>
					align="right"
					columnKey="uniqueVisitors"
					currentSortBy={sortBy}
					label={t("metrics.table.unique-visitors")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
				/>
			),
			cell: ({ row }) => <div className="text-right">{row.original.uniqueVisitors.toLocaleString()}</div>,
		},
		{
			accessorKey: "ctrPercent",
			size: 100,
			header: () => (
				<SortableHeader<SearchSortByColumn>
					align="right"
					columnKey="ctrPercent"
					currentSortBy={sortBy}
					label={t("metrics.table.ctr-percent")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
					tooltip={t("metrics.table.tooltips.ctr-percent")}
				/>
			),
			cell: ({ row }) => <div className="text-right">{Math.round(row.original.ctrPercent)}%</div>,
		},
		{
			accessorKey: "mostClickedTitle",
			size: 200,
			header: () => (
				<SortableHeader<SearchSortByColumn>
					align="left"
					columnKey="mostClickedTitle"
					currentSortBy={sortBy}
					label={t("metrics.table.most-clicked-item")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
				/>
			),
			cell: ({ row }) => {
				const { mostClickedTitle, mostClickedUrl, mostClickedCatalog } = row.original;

				if (!mostClickedTitle || !mostClickedUrl) {
					return <div className="text-left px-2 text-gray-400">—</div>;
				}

				const itemType = mostClickedCatalog ? t("metrics.table.catalog") : t("metrics.table.article");
				const displayText = `${mostClickedTitle} (${itemType})`;

				return (
					<div className="text-left px-2">
						<a
							className="text-blue-600 hover:text-blue-800 hover:underline"
							href={mostClickedUrl}
							rel="noopener noreferrer"
							target="_blank"
							title={displayText}
						>
							<TruncatedText text={displayText} />
						</a>
					</div>
				);
			},
		},
		{
			accessorKey: "avgClickPosition",
			size: 140,
			header: () => (
				<SortableHeader<SearchSortByColumn>
					align="right"
					columnKey="avgClickPosition"
					currentSortBy={sortBy}
					label={t("metrics.table.avg-click-position")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
					tooltip={t("metrics.table.tooltips.avg-click-position")}
				/>
			),
			cell: ({ row }) => (
				<div className="text-right">
					{row.original.avgClickPosition > 0 ? Math.ceil(row.original.avgClickPosition) : "—"}
				</div>
			),
		},
		{
			accessorKey: "refinementPercent",
			size: 140,
			header: () => (
				<SortableHeader<SearchSortByColumn>
					align="right"
					columnKey="refinementPercent"
					currentSortBy={sortBy}
					label={t("metrics.table.refinement-rate-percent")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
					tooltip={t("metrics.table.tooltips.refinement-rate-percent")}
				/>
			),
			cell: ({ row }) => <div className="text-right	">{Math.round(row.original.refinementPercent)}%</div>,
		},
	];
};
