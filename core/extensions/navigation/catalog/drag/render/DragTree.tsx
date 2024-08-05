import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import styled from "@emotion/styled";
import { DropOptions, getBackendOptions, MultiBackend, NodeModel, Tree, useDragOver } from "@minoru/react-dnd-treeview";
import { CssBaseline } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import CreateArticle from "../../../../artilce/actions/CreateArticle";
import EditMenu from "../../../../item/EditMenu";
import CommentCountNavExtension from "../../../../markdown/elements/comment/edit/components/CommentCountNavExtension";
import { CategoryLink, ItemLink } from "../../../NavigationLinks";
import IconExtension from "../../main/render/IconExtension";
import NavigationItem from "../../main/render/Item";
import DragTreeTransformer from "../logic/DragTreeTransformer";
import getOpenItemsIds from "../logic/getOpenItemsIds";

const ExportLevNavDragTree = ({ items, closeNavigation }: { items: ItemLink[]; closeNavigation?: () => void }) => {
	const isEdit = IsEditService.value;
	const articleProps = ArticlePropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [dragged, setDragged] = useState<boolean>(isEdit);
	const [treeData, setTreeData] = useState<NodeModel<ItemLink>[]>(DragTreeTransformer.getRenderDragNav(items));

	useEffect(() => {
		setTreeData(DragTreeTransformer.getRenderDragNav(items));
	}, [items]);

	const handleOnDrop = async (draggedItemPath: string, newTree: NodeModel<ItemLink>[]) => {
		setDragged(false);
		const url = apiUrlCreator.updateCatalogNav(articleProps.logicPath);
		const body = JSON.stringify({ draggedItemPath, old: treeData, new: newTree });
		const res = await FetchService.fetch<NodeModel<ItemLink>[]>(url, body, MimeTypes.json);
		if (!res.ok) return;
		setTreeData(await res.json());
		setDragged(true);
	};

	useEffect(() => {
		setDragged(isEdit);
	}, [isEdit]);

	return (
		<LevNavDragTree items={treeData} canDrag={dragged} onDrop={handleOnDrop} closeNavigation={closeNavigation} />
	);
};

interface LevNavDragTreeProps {
	items: NodeModel<ItemLink>[];
	onDrop?: (draggedItemPath: string, data: NodeModel<ItemLink>[]) => void;
	closeNavigation?: () => void;
	canDrag?: boolean;
	className?: string;
}

const LevNavDragTree = styled((props: LevNavDragTreeProps) => {
	const { items = [], onDrop, closeNavigation, canDrag = true, className } = props;
	const articleElement = ArticleRefService.value.current;
	const [initialOpen, setInitialOpen] = useState(new Set<number | string>(getOpenItemsIds(items)));
	const [draggedItemPath, setDraggedItemPath] = useState<string>();
	const onDropHandler = useCallback(
		(tree: NodeModel<ItemLink>[]) => {
			onDrop(draggedItemPath, tree);
			setDraggedItemPath(undefined);
		},
		[draggedItemPath],
	);

	const handleCanDrop = (_, { dropTarget, dragSource, dropTargetId }: DropOptions<ItemLink>) => {
		if (!canDrag) false;
		const flag =
			((dropTargetId == 0 || dragSource?.parent === dropTargetId || dropTarget?.droppable) ?? false) &&
			dragSource?.id !== dropTargetId;
		return flag;
	};

	return (
		<>
			<CssBaseline />
			<DndProvider backend={MultiBackend} options={getBackendOptions()}>
				<div className={className}>
					<Tree<ItemLink>
						tree={items}
						rootId={DragTreeTransformer.getRootId()}
						sort={false}
						insertDroppableFirst={false}
						dropTargetOffset={10}
						onDrop={onDropHandler}
						canDrop={handleCanDrop}
						canDrag={() => canDrag}
						onDragStart={(tree) => setDraggedItemPath(tree.data.ref.path)}
						initialOpen={Array.from(initialOpen)}
						render={(node, { depth, isOpen, onToggle, containerRef }) => {
							const [thisItem, setThisItem] = useState(node.data);
							const [isHover, setIsHover] = useState(false);

							const isActive = thisItem.isCurrentLink;
							const existsContent =
								thisItem.type === ItemType.category ? (thisItem as CategoryLink).existContent : true;

							const updateAlwaysIsOpen = () => {
								if (isOpen) initialOpen.delete(node.id);
								else initialOpen.add(node.id);
								setInitialOpen(new Set(initialOpen));
							};

							const currentOnToggle = () => {
								onToggle();
								updateAlwaysIsOpen();
							};

							useEffect(() => {
								setThisItem(node.data);
							}, [node.data]);

							useEffect(() => {
								if ((node.data as CategoryLink)?.isExpanded && !isOpen) currentOnToggle();
							}, [(node.data as CategoryLink)?.isExpanded]);

							useEffect(() => {
								if (!node.data.isCurrentLink) return;
								containerRef.current?.scrollIntoView({
									behavior: "auto",
									inline: "center",
									block: "center",
								});
							}, []);

							return (
								<NavigationItem
									level={depth}
									isOpen={isOpen}
									item={thisItem}
									isHover={isHover}
									isDroppable={node.droppable}
									isActive={isActive}
									onToggle={currentOnToggle}
									dragOverProps={useDragOver(node.id, isOpen, onToggle)} //авторазворачивание
									onClick={() => {
										closeNavigation?.();
										articleElement?.scrollTo({
											top: 0,
											left: 0,
											behavior: "smooth",
										});
										if (!onToggle) return;
										if (!existsContent || isActive) currentOnToggle();
										else if (!isOpen) return currentOnToggle();
									}}
									leftExtensions={[
										<IconExtension key={0} item={thisItem} />,
										<CommentCountNavExtension key={1} item={thisItem} />,
									]}
									rightExtensions={[
										<EditMenu
											key={0}
											itemLink={thisItem}
											isCategory={node.droppable}
											setItemLink={setThisItem}
											onOpen={() => setIsHover(true)}
											onClose={() => setIsHover(false)}
										/>,
										<CreateArticle key={1} item={thisItem} />,
									]}
								/>
							);
						}}
						placeholderRender={(node, { depth }) => <div className={"placeholder depth-" + depth} />}
						classes={{
							root: "tree-root",
							draggingSource: "dragging-source",
							placeholder: "placeholder-container",
							// dropTarget: "drop-target", подсветка
						}}
					/>
				</div>
			</DndProvider>
		</>
	);
})`
	height: 100%;

	* {
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}

	> ul {
		padding-top: 20px;

		> li:first-of-type {
			margin-top: 0;
		}
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
	.drop-target {
		.a-drop-target {
			background-color: #e8f0fe;
		}
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
`;

export default ExportLevNavDragTree;
