import {
	type ColumnDef,
	getCoreRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@ui-kit/DataTable";
import { forwardRef, type HTMLAttributes, useMemo, useRef, useState } from "react";
import { VirtualizedTableBody } from "./VirtualTableBody";
import { VirtualTableHeader } from "./VirtualTableHeader";

export type AOAColumn = {
	key: string;
	name: string;
};

export type Row<T = unknown> = Record<string, T>;

const TableComponent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLTableElement>>((props, ref) => {
	const { children, className, ...rest } = props;
	return (
		<div className={className} ref={ref}>
			<table {...rest} className="w-full caption-bottom text-sm">
				{children}
			</table>
		</div>
	);
});

export const VirtualTable = ({ rows, columns }: { rows: Row[]; columns: AOAColumn[] }) => {
	const [sorting, setSorting] = useState<SortingState>([]);
	const tableContainerRef = useRef<HTMLDivElement>(null);

	const tansformedColumns: ColumnDef<Row>[] = useMemo(
		() =>
			columns.map((column) => ({
				accessorKey: column.key,
				header: column.name,
			})),
		[columns],
	);

	const table = useReactTable({
		data: rows,
		columns: tansformedColumns,
		enableMultiSort: true,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		state: {
			sorting,
		},
	});

	return (
		<TableComponent
			className="relative w-full overflow-x-auto bg-secondary-bg rounded-md text-primary-fg border border-secondary-border"
			ref={tableContainerRef}
		>
			<VirtualTableHeader table={table} />
			<VirtualizedTableBody table={table} tableContainerRef={tableContainerRef} />
		</TableComponent>
	);
};
