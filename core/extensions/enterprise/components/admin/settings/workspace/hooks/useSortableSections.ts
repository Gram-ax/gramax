import { DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback } from "react";
import { WorkspaceSection } from "../types/WorkspaceComponent";

export function useSortableSections(
	sections: Record<string, WorkspaceSection>,
	setSections: (sections: Record<string, WorkspaceSection>) => void
) {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8
			}
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates
		})
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;

			if (over && active.id !== over.id) {
				const sectionKeys = Object.keys(sections);
				const oldIndex = sectionKeys.indexOf(active.id as string);
				const newIndex = sectionKeys.indexOf(over.id as string);

				if (oldIndex !== -1 && newIndex !== -1) {
					const newSectionKeys = arrayMove(sectionKeys, oldIndex, newIndex);

					// Перестраиваем объект sections в новом порядке
					const reorderedSections: Record<string, WorkspaceSection> = {};
					newSectionKeys.forEach((key) => {
						reorderedSections[key] = sections[key];
					});

					setSections(reorderedSections);
				}
			}
		},
		[sections, setSections]
	);

	return {
		sensors,
		handleDragEnd
	};
}
