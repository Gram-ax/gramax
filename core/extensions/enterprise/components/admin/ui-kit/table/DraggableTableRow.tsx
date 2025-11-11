import { Row } from "@ui-kit/DataTable";
import { useSortable } from "@dnd-kit/sortable";
import { CSSProperties } from "react";
import { TableRow } from "@ui-kit/Table";
import { CSS } from "@dnd-kit/utilities";

export function DraggableTableRow<T>({
	row,
	children,
	state,
	rowKey
}: {
	row: Row<T>;
	children: React.ReactNode;
	state?: string | false;
	rowKey: keyof T;
}) {
	const { transform, setNodeRef, isDragging } = useSortable({
		id: row.original[rowKey] as string
	});

	const style: CSSProperties = {
		transform: CSS.Transform.toString(transform),
		opacity: isDragging ? 0.8 : 1,
		zIndex: isDragging ? 1 : 0,
		position: "relative"
	};

	return (
		<TableRow ref={setNodeRef} style={style} data-state={state}>
			{children}
		</TableRow>
	);
}
