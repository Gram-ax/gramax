import { IconButton } from "@ui-kit/Button";
import { useDragHandle } from "./DraggableTableRow";

export function TableDraggableButton() {
	const handle = useDragHandle();

	return (
		<div className="flex items-center justify-center">
			<IconButton
				className="p-0 h-4 w-4 cursor-grab active:cursor-grabbing"
				icon="grip-vertical"
				ref={handle?.setActivatorNodeRef}
				type="button"
				variant="text"
				{...handle?.attributes}
				{...handle?.listeners}
			/>
		</div>
	);
}
