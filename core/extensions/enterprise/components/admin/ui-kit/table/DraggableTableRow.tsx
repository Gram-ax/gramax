import type { useSortable } from "@dnd-kit/sortable";
import { useSortable as useSortableHook } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Row } from "@ui-kit/DataTable";
import { TableRow } from "@ui-kit/Table";
import { type CSSProperties, createContext, useContext } from "react";

type SortableReturn = ReturnType<typeof useSortable>;

interface DragHandleContextValue {
	attributes: SortableReturn["attributes"];
	listeners: SortableReturn["listeners"];
	setActivatorNodeRef: SortableReturn["setActivatorNodeRef"];
}

const DragHandleContext = createContext<DragHandleContextValue | null>(null);

export const DragHandleProvider = DragHandleContext.Provider;

export const useDragHandle = () => useContext(DragHandleContext);

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
	const { attributes, listeners, transform, setNodeRef, setActivatorNodeRef, isDragging } = useSortableHook({
		id: row.original[rowKey] as string,
	});

	const style: CSSProperties = {
		transform: CSS.Transform.toString(transform),
		opacity: isDragging ? 0.8 : 1,
		zIndex: isDragging ? 1 : 0,
		position: "relative",
	};

	return (
		<DragHandleProvider value={{ attributes, listeners, setActivatorNodeRef }}>
			<TableRow data-state={state} ref={setNodeRef} style={style}>
				{children}
			</TableRow>
		</DragHandleProvider>
	);
}
