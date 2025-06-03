import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import useWatch from "@core-ui/hooks/useWatch";
import { useRouter } from "@core/Api/useRouter";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import styled from "@emotion/styled";
import type OtherLanguagesPresentWarning from "@ext/localization/actions/OtherLanguagesPresentWarning";
import { shouldShowActionWarning } from "@ext/localization/actions/OtherLanguagesPresentWarning";
import NavigationEvents from "@ext/navigation/NavigationEvents";
import { DropOptions, NodeModel, RenderParams, Tree, useDragOver } from "@minoru/react-dnd-treeview";
import { CssBaseline } from "@mui/material";
import React, { useCallback, useEffect, useState, type ComponentProps } from "react";
import CreateArticle from "../../../../artilce/actions/CreateArticle";
import EditMenu from "../../../../item/EditMenu";
import CommentCountNavExtension from "../../../../markdown/elements/comment/edit/components/CommentCountNavExtension";
import { CategoryLink, ItemLink } from "../../../NavigationLinks";
import IconExtension from "../../main/render/IconExtension";
import NavigationItem from "../../main/render/Item";
import DragTreeTransformer from "../logic/DragTreeTransformer";
import getOpenItemsIds from "../logic/getOpenItemsIds";

type handleOnDropType = (
	draggedItemPath: string,
	newTree: NodeModel<ItemLink>[],
	fetchComplete: () => void,
) => Promise<void> | void;

const ExportLevNavDragTree = ({ items, closeNavigation }: { items: ItemLink[]; closeNavigation?: () => void }) => {
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [dragged, setDragged] = useState<boolean>(!isReadOnly);
	const [treeData, setTreeData] = useState<NodeModel<ItemLink>[]>([]);
	const router = useRouter();

	useEffect(() => {
		setTreeData(DragTreeTransformer.getRenderDragNav(items));
	}, [items]);

	const handleOnDrop: handleOnDropType = async (draggedItemPath, newTree, fetchComplete) => {
		if (!DragTreeTransformer.isModified(draggedItemPath, treeData, newTree)) return;
		setDragged(false);

		const url = apiUrlCreator.updateCatalogNav(articleProps.ref.path);
		const body = JSON.stringify({ draggedItemPath, old: treeData, new: newTree });
		const res = await FetchService.fetch<NodeModel<ItemLink>[]>(url, body, MimeTypes.json);
		if (!res.ok) return;
		fetchComplete();
		const newItems = await res.json();
		const currentItem = newItems?.find((i) => i.data.isCurrentLink);
		if (currentItem) router.pushPath(currentItem.data.pathname);
		setTreeData(newItems);
		setDragged(true);
	};

	useEffect(() => {
		setDragged(!isReadOnly);
	}, [isReadOnly]);

	return (
		<LevNavDragTree
			items={treeData}
			canDrag={dragged}
			onDrop={(...args) => {
				shouldShowActionWarning(catalogProps)
					? ModalToOpenService.setValue<ComponentProps<typeof OtherLanguagesPresentWarning>>(
							ModalToOpen.MultilangActionConfirm,
							{
								action: () => handleOnDrop(...args),
								catalogProps,
								isOpen: true,
								onClose: () => ModalToOpenService.resetValue(),
							},
					  )
					: handleOnDrop(...args);
			}}
			closeNavigation={closeNavigation}
		/>
	);
};

interface LevNavDragTreeProps {
	items: NodeModel<ItemLink>[];
	onDrop?: handleOnDropType;
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
		(tree: NodeModel<ItemLink>[], { dropTargetId }: DropOptions<ItemLink>) => {
			const addToInitialOpen = () => {
				initialOpen.add(dropTargetId);
				setInitialOpen(new Set(initialOpen));
			};
			void onDrop(draggedItemPath, tree, addToInitialOpen);
			setDraggedItemPath(undefined);
		},
		[draggedItemPath],
	);

	const handleCanDrop = (_, { dragSource, dropTargetId }: DropOptions<ItemLink>) => {
		if (dragSource?.parent === dropTargetId) return true;
	};

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
					canDrag={() => canDrag}
					onDragEnd={() => setDraggedItemPath(undefined)}
					onDragStart={(tree) => setDraggedItemPath(tree.data.ref.path)}
					initialOpen={Array.from(initialOpen)}
					render={(node, params) => (
						<NavItem
							node={node}
							params={params}
							initialOpen={initialOpen}
							setInitialOpen={setInitialOpen}
							draggedItemPath={draggedItemPath}
							closeNavigation={closeNavigation}
							articleElement={articleElement}
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

interface NavItemProps {
	node: NodeModel<ItemLink>;
	params: RenderParams;
	initialOpen: Set<number | string>;
	setInitialOpen: (initialOpen: Set<number | string>) => void;
	draggedItemPath: string;
	closeNavigation: () => void;
	articleElement: HTMLElement;
}

const NavItem = React.memo(
	({
		node,
		params: { depth, isOpen, onToggle, containerRef, isDropTarget },
		initialOpen,
		setInitialOpen,
		draggedItemPath,
		closeNavigation,
		articleElement,
	}: NavItemProps) => {
		const [thisItem, setThisItem] = useState(node.data);
		const [isHover, setIsHover] = useState(false);

		const isActive = thisItem.isCurrentLink && ArticleViewService.isDefaultView();
		const existsContent = thisItem.type === ItemType.category ? (thisItem as CategoryLink).existContent : true;
		const isCategory = !!(thisItem as CategoryLink).items?.length;

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

		useWatch(() => {
			if (!isActive) return;
			containerRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
			});
		}, [isActive]);

		useEffect(() => {
			if (!isActive) return;
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
				isCategory={isCategory}
				onToggle={currentOnToggle}
				isDropTarget={isDropTarget}
				isDragStarted={!!draggedItemPath}
				onClick={() => {
					NavigationEvents.emit("item-click", { path: thisItem.ref.path });
					closeNavigation?.();
					if (node.data.isCurrentLink)
						articleElement?.scrollTo({
							top: 0,
							left: 0,
							behavior: "smooth",
						});
					if (!onToggle) return;
					if (!existsContent || isActive) currentOnToggle();
					else if (!isOpen) return currentOnToggle();
				}}
				leftExtensions={<LeftExtensions item={thisItem} />}
				rightExtensions={
					<RightExtensions
						item={thisItem}
						isCategory={isCategory}
						setThisItem={setThisItem}
						setIsHover={setIsHover}
					/>
				}
				{...useDragOver(node.id, isOpen, currentOnToggle)} //auto-expand
			/>
		);
	},
);

const LeftExtensions = ({ item }: { item: ItemLink }) => {
	return (
		<>
			<IconExtension item={item} />
			<CommentCountNavExtension item={item} />
		</>
	);
};

const RightExtensions = React.memo(
	({
		item,
		isCategory,
		setThisItem,
		setIsHover,
	}: {
		item: ItemLink;
		isCategory: boolean;
		setThisItem: (item: ItemLink) => void;
		setIsHover: (isHover: boolean) => void;
	}) => {
		const onOpenHandler = useCallback(() => {
			setIsHover(true);
		}, [setIsHover]);

		const onCloseHandler = useCallback(() => {
			setIsHover(false);
		}, [setIsHover]);

		return (
			<>
				<CreateArticle item={item} />
				<EditMenu
					itemLink={item}
					isCategory={isCategory}
					setItemLink={setThisItem}
					onOpen={onOpenHandler}
					onClose={onCloseHandler}
				/>
			</>
		);
	},
);

export default ExportLevNavDragTree;
