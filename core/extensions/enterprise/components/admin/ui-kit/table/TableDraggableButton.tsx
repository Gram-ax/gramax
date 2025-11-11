import { useSortable } from "@dnd-kit/sortable";
import { IconButton } from "@ui-kit/Button";

export function TableDraggableButton({ rowId }: { rowId: string }) {
	const { attributes, listeners } = useSortable({
		id: rowId,
	});

	return (
		<div className="flex items-center justify-center">
			<IconButton type="button" className="p-0 h-4 w-4" icon="grip-vertical" variant="text" {...attributes} {...listeners} />
		</div>
	);
}
