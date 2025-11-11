import { DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback } from "react";

export function useSortableCatalogs(
	dataIds: () => string[],
	setItems: (updater: (prev: string[]) => string[]) => void | ((items: string[]) => void)
) {
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	const handleDragEnd = useCallback(
		({ active, over }: DragEndEvent) => {
			if (active && over && active.id !== over.id) {
				const ids = dataIds();
				const oldIndex = ids.indexOf(active.id as string);
				const newIndex = ids.indexOf(over.id as string);
				setItems((data) => arrayMove(data, oldIndex, newIndex));
			}
		},

		[setItems, dataIds]
	);

	return { sensors, handleDragEnd };
}
