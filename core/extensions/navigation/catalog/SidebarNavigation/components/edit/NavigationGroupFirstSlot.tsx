import { useDroppable } from "@dnd-kit/core";
import { SidebarInsertionLine } from "@ext/navigation/catalog/SidebarNavigation/components/SidebarInsertionLine/SidebarInsertionLine";
import { useNavigationTreeStore } from "@ext/navigation/catalog/SidebarNavigation/store/navigationTreeStore";
import { DropMode } from "@ext/navigation/catalog/SidebarNavigation/utils/dropMode";
import { firstSlotId } from "@ext/navigation/catalog/SidebarNavigation/utils/groupSlotId";
import { useCreateArticle } from "../../../SidebarNavigation/hooks/useCreateArticle";
import { DragInsertionLine } from "../SidebarDragnDrop/DragInsertionLine";

interface NavigationGroupFirstSlotProps {
	groupId: string;
}

export const NavigationGroupFirstSlot = ({ groupId }: NavigationGroupFirstSlotProps) => {
	const droppableId = firstSlotId(groupId);
	const { setNodeRef } = useDroppable({ id: droppableId });
	const previousGroupId = useNavigationTreeStore((s) => {
		const groupIndex = s.rootIds.indexOf(groupId);
		return groupIndex > 0 ? s.rootIds[groupIndex - 1] : undefined;
	});
	const isDropTarget = useNavigationTreeStore(
		(s) => s.dragTarget?.anchorId === droppableId && s.dragTarget.mode === DropMode.FirstChild,
	);
	const createArticle = useCreateArticle();

	return (
		<div className="relative">
			<SidebarInsertionLine
				className="-bottom-[0.1875rem]"
				level={1}
				maxDepth={1}
				minDepth={1}
				onAdd={() => createArticle(undefined, previousGroupId)}
			/>
			<div className="pointer-events-none absolute inset-x-0 z-10 h-2" ref={setNodeRef}>
				{isDropTarget && <DragInsertionLine className="bottom-auto top-0 -translate-y-1/2" />}
			</div>
		</div>
	);
};
