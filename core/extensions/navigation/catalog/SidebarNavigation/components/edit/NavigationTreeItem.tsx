import { useCreateArticle } from "@ext/navigation/catalog/SidebarNavigation/hooks/useCreateArticle";
import { useInsertionLineState } from "@ext/navigation/catalog/SidebarNavigation/hooks/useInsertionLineState";
import { useItemDndState } from "@ext/navigation/catalog/SidebarNavigation/hooks/useItemDndState";
import { useNavigationItem } from "@ext/navigation/catalog/SidebarNavigation/hooks/useNavigationItem";
import { memo, useCallback, useEffect, useRef } from "react";
import { EditArticleItem } from "./EditArticleItem";
import { EditFolderItem } from "./EditFolderItem";

interface NavigationTreeItemProps {
	id: string;
	level: number;
}

const NavigationTreeItemInner = ({ id, level }: NavigationTreeItemProps) => {
	const createArticle = useCreateArticle();
	const { data, children: childIds, open, isSelected, toggleExpanded, select } = useNavigationItem(id);
	const itemRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on mount only
	useEffect(() => {
		if (!isSelected) return;
		itemRef.current?.scrollIntoView({ behavior: "instant", inline: "center", block: "center" });
	}, []);

	const dnd = useItemDndState(id);

	const isFolder = childIds.length > 0;
	const insertionLine = useInsertionLineState(id, level, isFolder, open);
	const dragLine = { showsDragLine: dnd.showsDragLine, isDragAnchor: dnd.isDragAnchor };

	if (!data) return null;

	const isNested = level > 1;
	const isHighlighted = dnd.isInsertionTarget || dnd.isDragTarget;

	const onSelect = useCallback(() => {
		if (isFolder && isSelected) return toggleExpanded(id, !open);
		select(id);
	}, [id, isFolder, isSelected, open, select, toggleExpanded]);

	const commonProps = {
		data,
		dnd,
		dragLine,
		insertionLine,
		isHighlighted,
		isNested,
		isSelected,
		itemRef,
		level,
		onAddChild: () => createArticle(id, childIds.at(-1)),
		onSelect,
	};

	if (isFolder) {
		return (
			<EditFolderItem {...commonProps} onToggle={(next) => toggleExpanded(id, next)} open={open}>
				{childIds.map((childId) => (
					<NavigationTreeItem id={childId} key={childId} level={level + 1} />
				))}
			</EditFolderItem>
		);
	}

	return <EditArticleItem {...commonProps} />;
};

export const NavigationTreeItem = memo(NavigationTreeItemInner);
