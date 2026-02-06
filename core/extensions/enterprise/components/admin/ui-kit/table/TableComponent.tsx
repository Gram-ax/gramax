import styled from "@emotion/styled";
import { ColumnDef, Table as ReactTable, Row } from "@ui-kit/DataTable";
import { Table, TableRow } from "@ui-kit/Table";
import { TableBodyComponent } from "./TableBodyComponent";
import { TableCellComponent } from "./TableCellComponent";
import { TableHeaderComponent } from "./TableHeaderComponent";

export const TABLE_SELECT_COLUMN_CODE = "select";
export const TABLE_EDIT_COLUMN_CODE = "edit";
export const TABLE_COLUMN_CODE_DEFAULT = "default";
export const TABLE_DRAGGABLE_COLUMN_CODE = "draggable";

export interface TableComponentProps<T> {
	table: ReactTable<T>;
	columns: ColumnDef<T>[];
	onRowClick?: (row: Row<T>) => void;
}

export const columnTdClassName = {
	[TABLE_SELECT_COLUMN_CODE]: "w-8",
	[TABLE_EDIT_COLUMN_CODE]: "w-8 pl-3 cursor-pointer",
	[TABLE_COLUMN_CODE_DEFAULT]: "w-auto",
	[TABLE_DRAGGABLE_COLUMN_CODE]: "w-8",
};

export const columnThClassName = {
	[TABLE_SELECT_COLUMN_CODE]: "w-8",
	[TABLE_EDIT_COLUMN_CODE]: "w-8",
	[TABLE_COLUMN_CODE_DEFAULT]: "auto",
};

const Wrapper = styled.div`
	& > div {
		overflow: unset !important;
		overflow-x: unset !important;
		overflow-y: unset !important;
	}
`;

export const TableComponent = <T,>({ table, columns, onRowClick }: TableComponentProps<T>) => {
	return (
		<Wrapper className="gx-table rounded-md border">
			<Table>
				<TableHeaderComponent table={table} />
				<TableBodyComponent
					columns={columns}
					renderRow={(row) => (
						<TableRow data-state={row.getIsSelected() && "selected"} key={row.id}>
							{row.getAllCells().map((cell, idx) => (
								<TableCellComponent
									cell={cell}
									idx={idx}
									key={cell.id}
									onClick={
										cell.column.id === TABLE_SELECT_COLUMN_CODE
											? (e) => e.stopPropagation()
											: cell.column.id === TABLE_EDIT_COLUMN_CODE
												? () => onRowClick?.(row)
												: undefined
									}
								/>
							))}
						</TableRow>
					)}
					table={table}
				/>
			</Table>
		</Wrapper>
	);
};
