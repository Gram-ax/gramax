import { Checkbox, type CheckedState } from "@ui-kit/Checkbox";
import type { ColumnDef } from "@ui-kit/DataTable";
import { Icon } from "@ui-kit/Icon";
import { TABLE_DRAGGABLE_COLUMN_CODE, TABLE_EDIT_COLUMN_CODE, TABLE_SELECT_COLUMN_CODE } from "./TableComponent";
import { TableDraggableButton } from "./TableDraggableButton";

export const selectColumn = <T,>(): ColumnDef<T> => ({
	id: TABLE_SELECT_COLUMN_CODE,
	header: ({ table }) => (
		<div className="[&_input[aria-hidden='true']]:hidden">
			<Checkbox
				aria-label="Select all"
				checked={
					(table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")) as CheckedState
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
			/>
		</div>
	),
	cell: ({ row }) => {
		return (
			<div className="[&_input[aria-hidden='true']]:hidden">
				<Checkbox
					aria-label="Select row"
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
				/>
			</div>
		);
	},
	size: 32,
	enableSorting: false,
	enableHiding: false,
});

export const editColumn = <T,>(): ColumnDef<T> => ({
	id: TABLE_EDIT_COLUMN_CODE,
	cell: () => <Icon className="text-muted" icon="pen" />,
	size: 32,
	meta: { cellClassName: "cursor-pointer pr-0" },
	enableSorting: false,
	enableHiding: false,
});

export const dragColumn = <T,>(): ColumnDef<T> => ({
	id: TABLE_DRAGGABLE_COLUMN_CODE,
	cell: () => <TableDraggableButton />,
	meta: { cellClassName: "pr-0" },
	size: 32,
	enableSorting: false,
	enableHiding: false,
});
