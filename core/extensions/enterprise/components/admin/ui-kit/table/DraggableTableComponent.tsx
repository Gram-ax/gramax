import { useMemo } from "react";
import { ColumnDef, Row, useReactTable } from "@ui-kit/DataTable";
import { closestCenter, DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DraggableTableRow } from "./DraggableTableRow";
import { TableHeaderComponent } from "./TableHeaderComponent";
import { TableBodyComponent } from "./TableBodyComponent";
import { TableCellComponent } from "./TableCellComponent";
import { useSortableCatalogs } from "@ui-kit/DataTable";
import { Table } from "@ui-kit/Table";

interface DraggableTableComponentProps<T> {
	table: ReturnType<typeof useReactTable<T>>;
	columns: ColumnDef<T>[];
	onDragChange: React.Dispatch<React.SetStateAction<string[]>>;
	rowKey: keyof T;
}

export function DraggableTableComponent<T>({ table, columns, onDragChange, rowKey }: DraggableTableComponentProps<T>) {
	const dataIds = useMemo(
		() => table.getRowModel().rows?.map(({ original }) => original[rowKey] as string) || [],
		[table.getRowModel().rows],
	);

	const { sensors, handleDragEnd } = useSortableCatalogs(() => dataIds, onDragChange);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			modifiers={[restrictToVerticalAxis]}
			onDragEnd={handleDragEnd}
		>
			<div className="overflow-hidden rounded-md border">
				<Table>
					<TableHeaderComponent table={table} />
					<SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
						<TableBodyComponent
							table={table}
							columns={columns}
							renderRow={(row) => (
								<DraggableTableRow<T>
									key={row.id}
									row={row as Row<any>}
									state={row.getIsSelected() && "selected"}
									rowKey={rowKey}
								>
									{row.getVisibleCells().map((cell, idx) => (
										<TableCellComponent key={cell.id} cell={cell} idx={idx} />
									))}
								</DraggableTableRow>
							)}
						/>
					</SortableContext>
				</Table>
			</div>
		</DndContext>
	);
}
