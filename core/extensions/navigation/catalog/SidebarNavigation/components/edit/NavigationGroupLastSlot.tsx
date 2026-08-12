import { useDroppable } from "@dnd-kit/core";
import { useNavigationTreeStore } from "@ext/navigation/catalog/SidebarNavigation/store/navigationTreeStore";
import { DropMode } from "@ext/navigation/catalog/SidebarNavigation/utils/dropMode";
import { lastSlotId } from "@ext/navigation/catalog/SidebarNavigation/utils/groupSlotId";
import { DragInsertionLine } from "../SidebarDragnDrop/DragInsertionLine";

interface NavigationGroupLastSlotProps {
	groupId: string;
}

export const NavigationGroupLastSlot = ({ groupId }: NavigationGroupLastSlotProps) => {
	const droppableId = lastSlotId(groupId);
	const { setNodeRef } = useDroppable({ id: droppableId });
	const isDropTarget = useNavigationTreeStore(
		(s) =>
			s.dragTarget?.anchorId === droppableId &&
			(s.dragTarget.mode === DropMode.LastChild || s.dragTarget.mode === DropMode.LastRoot),
	);

	return (
		<div className="pointer-events-none absolute inset-x-2 -bottom-1 z-10 h-2" ref={setNodeRef}>
			{isDropTarget && <DragInsertionLine />}
		</div>
	);
};
