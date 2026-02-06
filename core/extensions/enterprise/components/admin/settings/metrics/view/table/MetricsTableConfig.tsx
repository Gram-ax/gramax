import type { SortByColumn, SortOrder } from "@ext/enterprise/components/admin/settings/metrics/filters";
import { TABLE_SELECT_COLUMN_CODE } from "@ext/enterprise/components/admin/ui-kit/table/TableComponent";
import t from "@ext/localization/locale/translate";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Checkbox } from "@ui-kit/Checkbox";
import { type ColumnDef, useTableSelection } from "@ui-kit/DataTable";
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
	disabled?: boolean;
}

export interface SortConfig {
	sortBy: SortByColumn;
	sortOrder: SortOrder;
	onSortChange: (columnKey: SortByColumn) => void;
}
export const createMetricsTableColumns = (sortConfig: SortConfig): ColumnDef<MetricsTableRow>[] => {
	const { sortBy, sortOrder, onSortChange } = sortConfig;

	const allColumns: ColumnDef<MetricsTableRow>[] = [
		{
			id: TABLE_SELECT_COLUMN_CODE,
			header: ({ table }) => {
				const { allSelectableSelected, someSelectableSelected, handleSelectAll } = useTableSelection({
					table,
					isRowDisabled: () => false,
				});

				return (
					<Checkbox
						aria-label="Select all"
						checked={(allSelectableSelected || (someSelectableSelected && "indeterminate")) as CheckedState}
						onCheckedChange={handleSelectAll}
					/>
				);
			},
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
					onClick={(e) => e.stopPropagation()}
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			accessorKey: "catalogName",
			size: 150,
			header: () => (
				<SortableHeader
					align="left"
					columnKey="catalog"
					currentSortBy={sortBy}
					label={t("metrics.table.catalog-name")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
				/>
			),
			cell: ({ row }) => <TruncatedText className="text-left" text={row.original.catalogName} />,
		},
		{
			accessorKey: "parentArticle",
			size: 180,
			header: () => (
				<SortableHeader
					align="left"
					columnKey="parent_article"
					currentSortBy={sortBy}
					label={t("metrics.table.parent-article")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
				/>
			),
			cell: ({ row }) => <TruncatedText className="text-left" text={row.original.parentArticle} />,
		},
		{
			accessorKey: "articleName",
			header: () => (
				<SortableHeader
					align="left"
					columnKey="article"
					currentSortBy={sortBy}
					label={t("metrics.table.article")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
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
				}, []);

				const linkElement = (
					<a
						className="text-link block truncate"
						href={data.path}
						onClick={(e) => e.stopPropagation()}
						ref={linkRef}
						rel="noopener noreferrer"
						style={{
							color: "var(--color-link)",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
						target="_blank"
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
					columnKey="visitors"
					currentSortBy={sortBy}
					label={t("metrics.table.visitors")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
				/>
			),
			cell: ({ row }) => <span className="block text-center">{row.original.visitors}</span>,
		},
		{
			accessorKey: "visits",
			size: 90,
			header: () => (
				<SortableHeader
					columnKey="visits"
					currentSortBy={sortBy}
					label={t("metrics.table.visits")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
				/>
			),
			cell: ({ row }) => <span className="block text-center">{row.original.visits}</span>,
		},
		{
			accessorKey: "pageviews",
			size: 100,
			header: () => (
				<SortableHeader
					columnKey="pageviews"
					currentSortBy={sortBy}
					label={t("metrics.table.pageviews")}
					onSortChange={onSortChange}
					sortOrder={sortOrder}
				/>
			),
			cell: ({ row }) => <span className="block text-center">{row.original.pageviews}</span>,
		},
	];

	return allColumns;
};
