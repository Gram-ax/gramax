import { closestCenter, DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { type ColumnDef, type Row, type useReactTable, useSortableCatalogs } from "@ui-kit/DataTable";
import { Table } from "@ui-kit/Table";
import { useMemo } from "react";
import { DraggableTableRow } from "./DraggableTableRow";
import { TableBodyComponent } from "./TableBodyComponent";
import { TableCellComponent } from "./TableCellComponent";
import { TABLE_DRAGGABLE_COLUMN_CODE, TABLE_EDIT_COLUMN_CODE, TABLE_SELECT_COLUMN_CODE } from "./TableComponent";
import { TableHeaderComponent } from "./TableHeaderComponent";

interface DraggableTableComponentProps<T> {
	table: ReturnType<typeof useReactTable<T>>;
	columns: ColumnDef<T>[];
	onDragChange: React.Dispatch<React.SetStateAction<string[]>>;
	rowKey: keyof T;
}

const draggableColumnWidthPx = {
	[TABLE_SELECT_COLUMN_CODE]: 32,
	[TABLE_EDIT_COLUMN_CODE]: 32,
	[TABLE_DRAGGABLE_COLUMN_CODE]: 36,
} as const;

export function DraggableTableComponent<T>({ table, columns, onDragChange, rowKey }: DraggableTableComponentProps<T>) {
	const dataIds = useMemo(
		() => table.getRowModel().rows?.map(({ original }) => original[rowKey] as string) || [],
		[rowKey, table.getRowModel],
	);

	const { sensors, handleDragEnd } = useSortableCatalogs(() => dataIds, onDragChange);

	return (
		<DndContext
			collisionDetection={closestCenter}
			modifiers={[restrictToVerticalAxis]}
			onDragEnd={handleDragEnd}
			sensors={sensors}
		>
			<div className="overflow-hidden rounded-md border">
				<Table>
					<colgroup>
						{columns.map((column) => {
							const width =
								column.size ?? draggableColumnWidthPx[column.id as keyof typeof draggableColumnWidthPx];
							return <col key={column.id} style={width ? { width: `${width}px` } : undefined} />;
						})}
					</colgroup>
					<TableHeaderComponent table={table} />
					<SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
						<TableBodyComponent
							columns={columns}
							renderRow={(row) => (
								<DraggableTableRow<T>
									key={row.id}
									row={row as Row<T>}
									rowKey={rowKey}
									state={row.getIsSelected() && "selected"}
								>
									{row.getVisibleCells().map((cell, idx) => (
										<TableCellComponent cell={cell} idx={idx} key={cell.id} />
									))}
								</DraggableTableRow>
							)}
							table={table}
						/>
					</SortableContext>
				</Table>
			</div>
		</DndContext>
	);
}
