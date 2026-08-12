import { cn } from "@core-ui/utils/cn";
import { NavigationCollapseChevron } from "@ext/navigation/catalog/SidebarNavigation/components/Helpers/NavigationCollapseChevron";
import { BeforeItemDropZone } from "@ext/navigation/catalog/SidebarNavigation/components/SidebarDragnDrop/BeforeItemDropZone";
import { DragInsertionLine } from "@ext/navigation/catalog/SidebarNavigation/components/SidebarDragnDrop/DragInsertionLine";
import {
	DraggableSideMenuItemContent,
	ItemDroppable,
} from "@ext/navigation/catalog/SidebarNavigation/components/SidebarDragnDrop/ItemDndBindings";
import { SidebarInsertionLine } from "@ext/navigation/catalog/SidebarNavigation/components/SidebarInsertionLine/SidebarInsertionLine";
import { VerticalLineSegment } from "@ext/navigation/catalog/SidebarNavigation/components/SidebarInsertionLine/VerticalLineSegment";
import { useCollapsibleAnimation } from "@ext/navigation/catalog/SidebarNavigation/hooks/useCollapsibleAnimation";
import type { useInsertionLineState } from "@ext/navigation/catalog/SidebarNavigation/hooks/useInsertionLineState";
import type { DragLineState, useItemDndState } from "@ext/navigation/catalog/SidebarNavigation/hooks/useItemDndState";
import { DropMode } from "@ext/navigation/catalog/SidebarNavigation/utils/dropMode";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import { Collapsible, CollapsibleContent } from "@ui-kit/Collapsible";
import { SidebarMenuSub } from "@ui-kit/Sidebar";
import type { MutableRefObject, ReactNode } from "react";

interface EditFolderItemProps {
	data: ItemLink;
	level: number;
	open: boolean;
	isNested: boolean;
	isSelected: boolean;
	isHighlighted: boolean;
	children: ReactNode;
	itemRef: MutableRefObject<HTMLDivElement>;
	dnd: ReturnType<typeof useItemDndState>;
	insertionLine: ReturnType<typeof useInsertionLineState>;
	dragLine: DragLineState;
	onToggle: (next: boolean) => void;
	onSelect: () => void;
	onAddChild: () => void;
}

export const EditFolderItem = ({
	data,
	level,
	open,
	isNested,
	isSelected,
	isHighlighted,
	children,
	itemRef,
	dnd,
	insertionLine,
	dragLine,
	onToggle,
	onSelect,
	onAddChild,
}: EditFolderItemProps) => {
	const { animating, handleOpenChange, handleAnimationEnd } = useCollapsibleAnimation(onToggle);

	const { isDragging, dropMode, isDragLocked } = dnd;
	const { minDepth, maxDepth, handleAdd, handleParentHover, showsLine, isAnchor } = insertionLine;
	const { showsDragLine, isDragAnchor } = dragLine;

	const showsHeaderLine =
		dropMode === DropMode.Before || dropMode === DropMode.After || (dropMode === DropMode.Into && !open);
	const showsChildrenLine = dropMode === DropMode.Into && open;

	return (
		<Collapsible
			className={cn("relative flex flex-col gap-0.5", isDragging && "opacity-50")}
			onOpenChange={handleOpenChange}
			open={open}
			ref={itemRef}
		>
			<BeforeItemDropZone itemId={data.ref.path} />
			{(showsLine || (showsDragLine && !isDragAnchor && level > 1)) && (
				<VerticalLineSegment className={isAnchor ? "bottom-[0.3125rem]" : undefined} />
			)}
			<ItemDroppable id={data.ref.path}>
				{showsDragLine && isDragAnchor && level > 1 && <VerticalLineSegment className="bottom-[0.3125rem]" />}
				<DraggableSideMenuItemContent
					data={data}
					disabled={isDragLocked}
					id={data.ref.path}
					isCategory
					isHighlighted={isHighlighted}
					isNested={isNested}
					isSelected={isSelected}
					level={level}
					onAddChild={onAddChild}
					onSelect={onSelect}
					trigger={<NavigationCollapseChevron open={open} />}
				/>
				<SidebarInsertionLine
					className="-bottom-[0.3125rem]"
					level={level}
					maxDepth={maxDepth}
					minDepth={minDepth}
					onAdd={handleAdd}
					onParentHover={handleParentHover}
				/>
				{showsHeaderLine && <DragInsertionLine position={dropMode === DropMode.Before ? "top" : undefined} />}
			</ItemDroppable>
			<CollapsibleContent
				className={cn(!animating && "data-[state=open]:!overflow-visible")}
				onAnimationEnd={handleAnimationEnd}
			>
				<div className="relative ml-4">
					<SidebarMenuSub className="ml-0 gap-0 border-none p-0 [&>*:not(:first-child)]:pt-0.5">
						{children}
					</SidebarMenuSub>
					{showsChildrenLine && <DragInsertionLine className="-top-0.5 -translate-y-1/2" />}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
};
