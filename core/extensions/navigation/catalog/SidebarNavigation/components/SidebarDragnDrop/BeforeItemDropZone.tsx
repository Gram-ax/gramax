import { useDroppable } from "@dnd-kit/core";
import { beforeItemSlotId } from "@ext/navigation/catalog/SidebarNavigation/utils/beforeItemSlot";

export const BeforeItemDropZone = ({ itemId }: { itemId: string }) => {
	const { setNodeRef } = useDroppable({ id: beforeItemSlotId(itemId) });

	return <div className="pointer-events-none absolute inset-x-0 -top-1 z-30 h-4" ref={setNodeRef} />;
};
