import { closestCenter, DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ColumnDef, Row, useReactTable, useSortableCatalogs } from "@ui-kit/DataTable";
import { Table } from "@ui-kit/Table";
import { useMemo } from "react";
import { DraggableTableRow } from "./DraggableTableRow";
import { TableBodyComponent } from "./TableBodyComponent";
import { TableCellComponent } from "./TableCellComponent";
import { TableHeaderComponent } from "./TableHeaderComponent";

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
			collisionDetection={closestCenter}
			modifiers={[restrictToVerticalAxis]}
			onDragEnd={handleDragEnd}
			sensors={sensors}
		>
			<div className="overflow-hidden rounded-md border">
				<Table>
					<TableHeaderComponent table={table} />
					<SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
						<TableBodyComponent
							columns={columns}
							renderRow={(row) => (
								<DraggableTableRow<T>
									key={row.id}
									row={row as Row<any>}
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
