import {
	SortByColumn,
	SortOrder,
	VisibleColumns,
} from "@ext/enterprise/components/admin/settings/metrics/useMetricsFilters";
import { TABLE_SELECT_COLUMN_CODE } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import t from "@ext/localization/locale/translate";
import { Checkbox } from "@ui-kit/Checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";
import { ColumnDef, useTableSelection } from "@ui-kit/DataTable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ics-ui-kit/components/tooltip";
import { useEffect, useRef, useState } from "react";
import { SortableHeader, TruncatedText } from "./TableHelpers";

export interface MetricsTableRow {
	id: number;
	catalogName: string;
	parentArticle: string;
	articleName: string;
	path: string;
	visitors: number;
	visits: number;
	pageviews: number;
}

export interface SortConfig {
	sortBy: SortByColumn;
	sortOrder: SortOrder;
	onSortChange: (columnKey: SortByColumn) => void;
}

const COLUMN_KEY_MAP: Record<string, keyof VisibleColumns> = {
	catalogName: "catalog",
	parentArticle: "parentArticle",
	articleName: "article",
	visitors: "visitors",
	visits: "visits",
	pageviews: "pageviews",
};

export const createMetricsTableColumns = (sortConfig: SortConfig): ColumnDef<MetricsTableRow>[] => {
	const { sortBy, sortOrder, onSortChange } = sortConfig;

	const allColumns: ColumnDef<MetricsTableRow>[] = [
		{
			id: TABLE_SELECT_COLUMN_CODE,
			header: ({ table }) => {
				const { allSelectableSelected, someSelectableSelected, handleSelectAll } = useTableSelection({
					table: table as any,
					isRowDisabled: () => false,
				});

				return (
					<Checkbox
						checked={(allSelectableSelected || (someSelectableSelected && "indeterminate")) as CheckedState}
						onCheckedChange={handleSelectAll}
						aria-label="Select all"
					/>
				);
			},
			cell: ({ row }) => (
				<div onClick={(e) => e.stopPropagation()}>
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
					/>
				</div>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "catalogName",
			size: 150,
			header: () => (
				<SortableHeader
					label={t("metrics.table.catalog-name")}
					columnKey="catalog"
					currentSortBy={sortBy}
					sortOrder={sortOrder}
					onSortChange={onSortChange}
					align="left"
				/>
			),
			cell: ({ row }) => <TruncatedText text={row.original.catalogName} className="text-left" />,
		},
		{
			accessorKey: "parentArticle",
			size: 180,
			header: () => (
				<SortableHeader
					label={t("metrics.table.parent-article")}
					columnKey="parent_article"
					currentSortBy={sortBy}
					sortOrder={sortOrder}
					onSortChange={onSortChange}
					align="left"
				/>
			),
			cell: ({ row }) => <TruncatedText text={row.original.parentArticle} className="text-left" />,
		},
		{
			accessorKey: "articleName",
			header: () => (
				<SortableHeader
					label={t("metrics.table.article")}
					columnKey="article"
					currentSortBy={sortBy}
					sortOrder={sortOrder}
					onSortChange={onSortChange}
					align="left"
				/>
			),
			cell: ({ row }) => {
				const data = row.original;
				const linkRef = useRef<HTMLAnchorElement>(null);
				const [isTruncated, setIsTruncated] = useState(false);

				useEffect(() => {
					const element = linkRef.current;
					if (element) {
						setIsTruncated(element.scrollWidth > element.clientWidth);
					}
				}, [data.articleName]);

				const linkElement = (
					<a
						ref={linkRef}
						href={data.path}
						target="_blank"
						rel="noopener noreferrer"
						className="text-link block truncate"
						style={{
							color: "var(--color-link)",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{data.articleName}
					</a>
				);

				if (!isTruncated) {
					return <span className="block text-left">{linkElement}</span>;
				}

				return (
					<span className="block text-left">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>{linkElement}</TooltipTrigger>
								<TooltipContent>
									<p className="max-w-md break-words">{data.articleName}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</span>
				);
			},
		},
		{
			accessorKey: "visitors",
			size: 90,
			header: () => (
				<SortableHeader
					label={t("metrics.table.visitors")}
					columnKey="visitors"
					currentSortBy={sortBy}
					sortOrder={sortOrder}
					onSortChange={onSortChange}
				/>
			),
			cell: ({ row }) => <span className="block text-center">{row.original.visitors}</span>,
		},
		{
			accessorKey: "visits",
			size: 90,
			header: () => (
				<SortableHeader
					label={t("metrics.table.visits")}
					columnKey="visits"
					currentSortBy={sortBy}
					sortOrder={sortOrder}
					onSortChange={onSortChange}
				/>
			),
			cell: ({ row }) => <span className="block text-center">{row.original.visits}</span>,
		},
		{
			accessorKey: "pageviews",
			size: 100,
			header: () => (
				<SortableHeader
					label={t("metrics.table.pageviews")}
					columnKey="pageviews"
					currentSortBy={sortBy}
					sortOrder={sortOrder}
					onSortChange={onSortChange}
				/>
			),
			cell: ({ row }) => <span className="block text-center">{row.original.pageviews}</span>,
		},
	];

	return allColumns;
};
