import { IconButton } from "@ui-kit/Button";
import { type Column, flexRender, type Table } from "@ui-kit/DataTable";
import { TableHead, TableHeader, TableRow } from "@ui-kit/Table";
import type { CSSProperties } from "react";

const getCommonPinningStyles = (column: Column<unknown>): CSSProperties => {
	return {
		left: `${column.getStart("left")}px`,
		right: `${column.getAfter("right")}px`,
		position: "sticky",
		width: column.getSize(),
		zIndex: 1,
	};
};

const SORT_ICONS = {
	asc: "arrow-up",
	desc: "arrow-down",
	false: "chevrons-up-down",
} as const;

const ARIA_SORT = {
	asc: "ascending",
	desc: "descending",
	false: "none",
} as const;

const SortButton = ({ column }: { column: Column<unknown> }) => {
	const sortDirection = column.getIsSorted();
	const sortIcon = SORT_ICONS[sortDirection || "false"];

	const handleSort = () => {
		column.toggleSorting(sortDirection === "asc");
	};

	const ariaSort = ARIA_SORT[sortDirection || "false"];

	if (!column.getCanSort()) return null;

	return (
		<IconButton aria-sort={ariaSort} icon={sortIcon} onClick={handleSort} size="sm" type="button" variant="text" />
	);
};

export const VirtualTableHeader = <T,>({ table }: { table: Table<T> }) => {
	return (
		<TableHeader>
			{table.getHeaderGroups().map((headerGroup) => (
				<TableRow key={headerGroup.id}>
					{headerGroup.headers.map((header) => {
						const { column } = header;
						const isPlaceholder = header.isPlaceholder;

						return (
							<TableHead
								className="bg-primary-bg"
								colSpan={header.colSpan}
								key={header.id}
								style={{
									...getCommonPinningStyles(column as Column<unknown>),
									top: 0,
									zIndex: 1,
									boxShadow: "0 1px 0 0 hsl(var(--secondary-border))",
								}}
							>
								<div className="whitespace-nowrap items-center gap-1 flex justify-between">
									{isPlaceholder
										? null
										: flexRender(header.column.columnDef.header, header.getContext())}
									<SortButton column={column as Column<unknown>} />
								</div>
							</TableHead>
						);
					})}
				</TableRow>
			))}
		</TableHeader>
	);
};
