import { useRouter } from "@core/Api/useRouter";
import { useNavTreePersistence } from "@core/SitePresenter/NavTreeStateManager";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useDeferApi } from "@core-ui/hooks/useApi";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { cn } from "@core-ui/utils/cn";
import { type CollisionDetection, DndContext, DragOverlay, MeasuringFrequency, MeasuringStrategy } from "@dnd-kit/core";
import type OtherLanguagesPresentWarning from "@ext/localization/actions/OtherLanguagesPresentWarning";
import { shouldShowActionWarning } from "@ext/localization/actions/OtherLanguagesPresentWarning";
import DragTreeTransformer from "@ext/navigation/catalog/drag/logic/DragTreeTransformer";
import { useProvideCreateArticle } from "@ext/navigation/catalog/SidebarNavigation/hooks/useCreateArticle";
import { useHoverBelowNavigation } from "@ext/navigation/catalog/SidebarNavigation/hooks/useHoverBelowNavigation";
import { useNavigationDnd } from "@ext/navigation/catalog/SidebarNavigation/hooks/useNavigationDnd";
import {
	navigationTreeStore,
	useNavigationTreeStore,
} from "@ext/navigation/catalog/SidebarNavigation/store/navigationTreeStore";
import { parseBeforeItemSlotId } from "@ext/navigation/catalog/SidebarNavigation/utils/beforeItemSlot";
import { DropMode, type PersistedDropMode } from "@ext/navigation/catalog/SidebarNavigation/utils/dropMode";
import { navigationCollisionDetection } from "@ext/navigation/catalog/SidebarNavigation/utils/navigationCollisionDetection";
import { nodeModelsToItemLinks } from "@ext/navigation/catalog/SidebarNavigation/utils/nodeModelsToItemLinks";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import type { NodeModel } from "@minoru/react-dnd-treeview";
import { SidebarGroup } from "@ui-kit/Sidebar";
import { type ComponentProps, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { NavigationDragPreview } from "../SidebarDragnDrop/NavigationDragPreview";
import { AfterContainerInsertionLine } from "./AfterContainerInsertionLine";
import { NavigationGroupFirstSlot } from "./NavigationGroupFirstSlot";
import { NavigationGroupLastSlot } from "./NavigationGroupLastSlot";
import { NavigationTreeItem } from "./NavigationTreeItem";

// Hoisted: a fresh object here would be a new dnd-kit measuring config on every render, which rebuilds
// the dnd context and re-renders every item that calls useDraggable — i.e. the whole tree.
const MEASURING = {
	droppable: { strategy: MeasuringStrategy.WhileDragging, frequency: MeasuringFrequency.Optimized },
};

const collisionDetection: CollisionDetection = (args) => {
	const collisions = navigationCollisionDetection(args);
	const beforeItemCollision = collisions.find((collision) => parseBeforeItemSlotId(String(collision.id)));
	return beforeItemCollision ? [beforeItemCollision] : collisions;
};

export const NavigationTree = ({ items }: { items: ItemLink[]; closeNavigation?: () => void }) => {
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const articleProps = ArticlePropsService.value;
	const supportedLanguages = useCatalogPropsStore((state) => state.data?.supportedLanguages, "shallow");
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const router = useRouter();
	const treeScope = `${catalogName ?? ""}:${PageDataContextService.value.language.content ?? ""}`;

	const articlePropsRef = useRef(articleProps);

	const { effectiveItems, toggle, reconcileDrop } = useNavTreePersistence(catalogName, items, supportedLanguages);
	const currentItemsRef = useRef(effectiveItems);
	const pendingDropScopeRef = useRef<string>(null);

	const { call: updateCatalogNav } = useDeferApi<NodeModel<ItemLink>[]>({ opts: { mime: MimeTypes.json } });

	const { setNavItems, setOnDrop, setOnToggle, setDragLocked, flatIndex, draggingId, rootIds } =
		useNavigationTreeStore((s) => ({
			setNavItems: s.setNavItems,
			setOnDrop: s.setOnDrop,
			setOnToggle: s.setOnToggle,
			setDragLocked: s.setDragLocked,
			flatIndex: s.flatIndex,
			draggingId: s.draggingId,
			rootIds: s.rootIds,
		}));

	const containerRef = useRef<HTMLDivElement>(null);
	const { isHoverBelow } = useHoverBelowNavigation(containerRef);
	articlePropsRef.current = articleProps;

	useProvideCreateArticle();

	useLayoutEffect(() => {
		if (pendingDropScopeRef.current === treeScope) return;
		currentItemsRef.current = effectiveItems;
		setNavItems(effectiveItems, treeScope);
	}, [effectiveItems, treeScope, setNavItems]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const handleOnDrop = useCallback(
		async (draggedId: string, anchorId: string, mode: PersistedDropMode) => {
			const previousItems = currentItemsRef.current;
			const flatItems = DragTreeTransformer.getRenderDragNav(previousItems);
			const draggedNode = flatItems.find((n) => n.data?.ref?.path === draggedId);
			const anchorNode = flatItems.find((n) => n.data?.ref?.path === anchorId);
			if (!draggedNode || !anchorNode) return;

			const withoutDragged = flatItems.filter((n) => n !== draggedNode);
			const anchorIndex = withoutDragged.indexOf(anchorNode);
			const updated =
				mode === DropMode.Into
					? { ...draggedNode, parent: anchorNode.id }
					: { ...draggedNode, parent: anchorNode.parent };
			const insertIndex = mode === DropMode.Before ? anchorIndex : anchorIndex + 1;
			const newTree: NodeModel<ItemLink>[] = [
				...withoutDragged.slice(0, insertIndex),
				updated,
				...withoutDragged.slice(insertIndex),
			];

			if (!DragTreeTransformer.isModified(draggedId, flatItems, newTree)) return;

			const updateDisplayedItems = (links: ItemLink[]) => {
				if (navigationTreeStore.getState().scope !== treeScope) return;
				currentItemsRef.current = links;
				setNavItems(links, treeScope);
			};

			pendingDropScopeRef.current = treeScope;
			setDragLocked(true);
			updateDisplayedItems(nodeModelsToItemLinks(newTree, DragTreeTransformer.getRootId()));
			try {
				const newItems = await updateCatalogNav({
					url: (api) => api.updateCatalogNav(articlePropsRef.current.ref.path),
					opts: {
						body: { draggedItemPath: draggedId, old: flatItems, new: newTree },
						parse: "json",
						mime: MimeTypes.json,
					},
				});

				if (!newItems) {
					updateDisplayedItems(previousItems);
					return;
				}
				if (navigationTreeStore.getState().scope !== treeScope) return;

				const currentItem = newItems.find((i) => i.data.isCurrentLink);
				if (currentItem) router.pushPath(currentItem.data.pathname);

				const preservedItems = reconcileDrop(flatItems, newItems, draggedId);
				updateDisplayedItems(nodeModelsToItemLinks(preservedItems, DragTreeTransformer.getRootId()));
			} catch (error) {
				updateDisplayedItems(previousItems);
				throw error;
			} finally {
				if (pendingDropScopeRef.current === treeScope) pendingDropScopeRef.current = null;
				setDragLocked(false);
			}
		},
		[updateCatalogNav, reconcileDrop, setNavItems, setDragLocked, treeScope],
	);

	const onDrop = useCallback(
		async (...args: Parameters<typeof handleOnDrop>) => {
			if (shouldShowActionWarning(supportedLanguages?.length)) {
				ModalToOpenService.setValue<ComponentProps<typeof OtherLanguagesPresentWarning>>(
					ModalToOpen.MultilangActionConfirm,
					{
						action: () => handleOnDrop(...args),
						isOpen: true,
						onClose: () => ModalToOpenService.resetValue(),
					},
				);
			} else {
				await handleOnDrop(...args);
			}
		},
		[supportedLanguages?.length, handleOnDrop],
	);

	useEffect(() => {
		setOnDrop(isReadOnly ? null : onDrop);
	}, [isReadOnly, onDrop, setOnDrop]);

	useEffect(() => {
		setOnToggle((id, open) => {
			const path = navigationTreeStore.getState().flatIndex[id]?.ref?.path;
			if (!path) return;
			toggle(path, open);
		});
		return () => setOnToggle(null);
	}, [toggle, setOnToggle]);

	const { sensors, onDragStart, onDragMove, onDragEnd, onDragCancel } = useNavigationDnd(containerRef);

	return (
		<DndContext
			autoScroll={false}
			collisionDetection={collisionDetection}
			measuring={MEASURING}
			onDragCancel={onDragCancel}
			onDragEnd={onDragEnd}
			onDragMove={onDragMove}
			onDragStart={onDragStart}
			sensors={sensors}
		>
			<div
				className={cn(
					"relative mt-4 flex flex-col gap-3 [transform:translateZ(0)] [&_li]:mb-0 [&_li]:list-none",
					draggingId && "pointer-events-none",
				)}
				ref={containerRef}
			>
				{rootIds.map((groupId) => {
					const groupData = flatIndex[groupId];
					if (!groupData) return null;

					return (
						<SidebarGroup className="relative mt-0.5 py-0 px-2.5" key={groupId}>
							<NavigationGroupFirstSlot groupId={groupId} />
							<NavigationTreeItem id={groupId} level={1} />
							<NavigationGroupLastSlot groupId={groupId} />
						</SidebarGroup>
					);
				})}
			</div>
			<AfterContainerInsertionLine isVisible={isHoverBelow && !draggingId} />
			<DragOverlay>
				{draggingId && flatIndex[draggingId] && <NavigationDragPreview name={flatIndex[draggingId].title} />}
			</DragOverlay>
		</DndContext>
	);
};
