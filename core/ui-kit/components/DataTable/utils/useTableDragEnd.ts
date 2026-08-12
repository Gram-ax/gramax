import { type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback } from "react";

export function useSortableCatalogs(
	// biome-ignore lint/suspicious/noConfusingVoidType: idc
	setItems: (updater: (prev: string[]) => string[]) => void | ((items: string[]) => void),
) {
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const handleDragEnd = useCallback(
		({ active, over }: DragEndEvent) => {
			if (active && over && active.id !== over.id) {
				setItems((data) => {
					const oldIndex = data.indexOf(active.id as string);
					const newIndex = data.indexOf(over.id as string);
					return arrayMove(data, oldIndex, newIndex);
				});
			}
		},

		[setItems],
	);

	return { sensors, handleDragEnd };
}
