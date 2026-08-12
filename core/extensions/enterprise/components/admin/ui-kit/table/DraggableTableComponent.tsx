import { closestCenter, DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { type ColumnDef, type Row, type useReactTable, useSortableCatalogs } from "@ui-kit/DataTable";
import { Table } from "@ui-kit/Table";
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
	const rows = table.getRowModel()?.rows ?? [];
	const dataIds = rows.map(({ original }) => original[rowKey] as string) || [];

	const { sensors, handleDragEnd } = useSortableCatalogs(onDragChange);

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
						{columns.map((column) => (
							<col key={column.id} style={column.size ? { width: `${column.size}px` } : undefined} />
						))}
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
									{row.getVisibleCells().map((cell) => (
										<TableCellComponent cell={cell} key={cell.id} />
									))}
								</DraggableTableRow>
							)}
							rows={rows}
						/>
					</SortableContext>
				</Table>
			</div>
		</DndContext>
	);
}
