import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import { DropOptions, NodeModel, Tree } from "@minoru/react-dnd-treeview";
import { CssBaseline } from "@mui/material";
import React, { memo, useCallback, useMemo, useState } from "react";
import { ItemLink } from "../../../NavigationLinks";
import DragTreeTransformer from "../logic/DragTreeTransformer";
import getOpenItemsIds from "../logic/getOpenItemsIds";
import NavItem from "./NavItem";

type handleOnDropType = (
	draggedItemPath: string,
	newTree: NodeModel<ItemLink>[],
	fetchComplete: () => void,
) => Promise<void> | void;

interface LevNavDragTreeProps {
	items: NodeModel<ItemLink>[];
	onDrop?: handleOnDropType;
	closeNavigation?: () => void;
	canDrag?: boolean;
	className?: string;
}

const LevNavDragTree = (props: LevNavDragTreeProps) => {
	const { items = [], onDrop, closeNavigation, canDrag = true, className } = props;
	const [initialOpen, setInitialOpen] = useState(() => new Set<number | string>(getOpenItemsIds(items)));
	const [draggedItemPath, setDraggedItemPath] = useState<string>();

	useWatch(() => {
		setInitialOpen(new Set<number | string>(getOpenItemsIds(items)));
	}, [items?.length]);

	const toggleOpen = useCallback((id: number | string, shouldOpen: boolean) => {
		setInitialOpen((prev) => {
			const next = new Set(prev);
			if (shouldOpen) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	}, []);

	const onDropHandler = useCallback(
		(tree: NodeModel<ItemLink>[], { dropTargetId }: DropOptions<ItemLink>) => {
			const addToInitialOpen = () => {
				toggleOpen(dropTargetId, true);
			};
			void onDrop(draggedItemPath, tree, addToInitialOpen);
			setDraggedItemPath(undefined);
		},
		[draggedItemPath, onDrop, toggleOpen],
	);

	const handleCanDrop = useCallback((_, { dragSource, dropTargetId }: DropOptions<ItemLink>) => {
		if (dragSource?.parent === dropTargetId) return true;
	}, []);

	const handleDragEnd = useCallback(() => setDraggedItemPath(undefined), []);
	const handleDragStart = useCallback((tree: NodeModel<ItemLink>) => setDraggedItemPath(tree.data.ref.path), []);
	const canDragCheck = useCallback(() => canDrag, [canDrag]);

	const initialOpenArray = useMemo(() => Array.from(initialOpen), [initialOpen]);

	return (
		<>
			<CssBaseline />
			<div className={className}>
				<Tree<ItemLink>
					tree={items}
					rootId={DragTreeTransformer.getRootId()}
					sort={false}
					insertDroppableFirst={false}
					dropTargetOffset={6}
					onDrop={onDropHandler}
					canDrop={handleCanDrop}
					canDrag={canDragCheck}
					onDragEnd={handleDragEnd}
					onDragStart={handleDragStart}
					initialOpen={initialOpenArray}
					render={(node, params) => (
						<NavItem
							node={node}
							params={params}
							toggleOpen={toggleOpen}
							draggedItemPath={draggedItemPath}
							closeNavigation={closeNavigation}
						/>
					)}
					placeholderRender={(_, { depth }) => {
						return <div className={"placeholder depth-" + depth} />;
					}}
					classes={{
						root: "tree-root",
						draggingSource: "dragging-source",
						placeholder: "placeholder-container",
					}}
				/>
			</div>
		</>
	);
};

export default memo(
	styled(LevNavDragTree)`
		height: 100%;

		* {
			-webkit-user-select: none;
			-moz-user-select: none;
			-ms-user-select: none;
			user-select: none;
		}

		li {
			margin-bottom: 0;
		}

		.tree-root {
			height: 100%;
			padding-bottom: 10px;
		}

		.dragging-source {
			opacity: 0.3;
		}

		.placeholder-container {
			position: relative;

			div.placeholder {
				top: 0;
				right: 0;
				height: 2px;
				position: absolute;
				left: var(--left-padding);
				transform: translateY(-50%);
				background-color: var(--color-primary-general);
			}
		}
	`,
);
