import { ItemType } from "@core/FileStructue/Item/ItemType";
import { NodeModel, RenderParams, useDragOver } from "@minoru/react-dnd-treeview";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CategoryLink, ItemLink } from "../../../NavigationLinks";
import NavigationItem from "../../main/render/Item";
import useWatch from "@core-ui/hooks/useWatch";
import useHover from "@core-ui/hooks/useHover";
import LeftExtensions from "./LeftExtensions";
import RightExtensions from "./RightExtensions";
import useHandleItemClick from "@ext/navigation/catalog/main/logic/handleClick";

interface NavItemProps {
	node: NodeModel<ItemLink>;
	params: RenderParams;
	toggleOpen: (id: number | string, shouldOpen: boolean) => void;
	draggedItemPath: string;
	closeNavigation: () => void;
}

const NavItem = React.memo(
	({
		node,
		params: { depth, isOpen, onToggle, containerRef, isDropTarget },
		toggleOpen,
		draggedItemPath,
		closeNavigation,
	}: NavItemProps) => {
		const [thisItem, setThisItem] = useState(node.data);
		const [isMenuOpen, setIsMenuOpen] = useState(false);
		const isSelected = thisItem.isCurrentLink;
		const isHovered = useHover(containerRef);

		const existsContent = thisItem.type === ItemType.category ? (thisItem as CategoryLink).existContent : true;
		const isCategory = !!(thisItem as CategoryLink).items?.length;

		const currentOnToggle = useCallback(() => {
			onToggle();
			toggleOpen(node.id, !isOpen);
		}, [onToggle, toggleOpen, node.id, isOpen]);

		useEffect(() => {
			setThisItem(node.data);
		}, [node.data]);

		useEffect(() => {
			if ((node.data as CategoryLink)?.isExpanded && !isOpen) currentOnToggle();
		}, [(node.data as CategoryLink)?.isExpanded]);

		useWatch(() => {
			if (!isSelected) return;
			containerRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
			});
		}, [isSelected]);

		useEffect(() => {
			if (!isSelected) return;
			containerRef.current?.scrollIntoView({
				behavior: "auto",
				inline: "center",
				block: "center",
			});
		}, []);

		const toggleFunction = useCallback(() => {
			if (!onToggle) return;
			if (!existsContent || isSelected) currentOnToggle();
			else if (!isOpen) return currentOnToggle();
		}, [onToggle, existsContent, isSelected, currentOnToggle, isOpen]);

		const handleClick = useHandleItemClick({
			isCurrentLink: node.data.isCurrentLink,
			itemPath: thisItem.pathname,
			closeNavigation,
			toggleFunction,
		});

		const dragOverProps = useDragOver(node.id, isOpen, currentOnToggle);

		const handleMenuOpen = useCallback(() => setIsMenuOpen(true), []);
		const handleMenuClose = useCallback(() => setIsMenuOpen(false), []);

		const leftExtensions = useMemo(() => <LeftExtensions item={thisItem} />, [thisItem]);

		const shouldShowRightExtensions = isSelected || isHovered || isMenuOpen;
		const rightExtensions = useMemo(
			() =>
				shouldShowRightExtensions ? (
					<RightExtensions
						item={thisItem}
						isCategory={isCategory}
						setThisItem={setThisItem}
						onMenuOpen={handleMenuOpen}
						onMenuClose={handleMenuClose}
					/>
				) : null,
			[thisItem, isCategory, shouldShowRightExtensions, handleMenuOpen, handleMenuClose],
		);

		return (
			<NavigationItem
				level={depth}
				isOpen={isOpen}
				item={thisItem}
				isHover={thisItem.isCurrentLink}
				isCategory={isCategory}
				onToggle={currentOnToggle}
				isDropTarget={isDropTarget}
				isDragStarted={!!draggedItemPath}
				onClick={handleClick}
				leftExtensions={leftExtensions}
				rightExtensions={rightExtensions}
				{...dragOverProps}
			/>
		);
	},
);

export default NavItem;
