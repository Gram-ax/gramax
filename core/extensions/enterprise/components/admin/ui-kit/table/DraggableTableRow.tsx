import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Row } from "@ui-kit/DataTable";
import { TableRow } from "@ui-kit/Table";
import { CSSProperties } from "react";

export function DraggableTableRow<T>({
	row,
	children,
	state,
	rowKey,
}: {
	row: Row<T>;
	children: React.ReactNode;
	state?: string | false;
	rowKey: keyof T;
}) {
	const { transform, setNodeRef, isDragging } = useSortable({
		id: row.original[rowKey] as string,
	});

	const style: CSSProperties = {
		transform: CSS.Transform.toString(transform),
		opacity: isDragging ? 0.8 : 1,
		zIndex: isDragging ? 1 : 0,
		position: "relative",
	};

	return (
		<TableRow data-state={state} ref={setNodeRef} style={style}>
			{children}
		</TableRow>
	);
}
