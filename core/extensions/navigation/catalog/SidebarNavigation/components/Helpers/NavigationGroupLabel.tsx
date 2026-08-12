import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import { useDroppable } from "@dnd-kit/core";
import { SidebarInsertionLine } from "@ext/navigation/catalog/SidebarNavigation/components/SidebarInsertionLine/SidebarInsertionLine";
import { useCreateArticle } from "@ext/navigation/catalog/SidebarNavigation/hooks/useCreateArticle";
import { useNavigationTreeStore } from "@ext/navigation/catalog/SidebarNavigation/store/navigationTreeStore";
import { DropMode } from "@ext/navigation/catalog/SidebarNavigation/utils/dropMode";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import { useCallback } from "react";
import { DragInsertionLine } from "../SidebarDragnDrop/DragInsertionLine";
import { NavigationSectionLabel } from "./NavigationSectionLabel";

interface NavigationGroupLabelProps {
	groupId: string;
	groupData: ItemLink;
	icon: IconCode;
	onOpenChange?: (id: string, open: boolean) => void;
}

export const NavigationGroupLabel = ({ groupId, groupData, icon }: NavigationGroupLabelProps) => {
	const { setNodeRef } = useDroppable({ id: groupId });
	const dropMode = useNavigationTreeStore((s) =>
		s.dragTarget?.anchorId === groupId ? s.dragTarget.mode : undefined,
	);

	const createArticle = useCreateArticle();
	const handleAdd = useCallback(() => createArticle(groupId), [createArticle, groupId]);

	return (
		<div className="relative" ref={setNodeRef}>
			<NavigationSectionLabel data={groupData} icon={icon} />

			<SidebarInsertionLine
				className="-bottom-[0.1875rem]"
				level={1}
				maxDepth={1}
				minDepth={1}
				onAdd={handleAdd}
			/>
			{(dropMode === DropMode.Before || dropMode === DropMode.After) && (
				<DragInsertionLine position={dropMode === DropMode.Before ? "top" : undefined} />
			)}
		</div>
	);
};
