import { useRouter } from "@core/Api/useRouter";
import { useNavTreePersistence, useNavTreeStore } from "@core/SitePresenter/NavTreeStateManager";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useDeferApi } from "@core-ui/hooks/useApi";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import type OtherLanguagesPresentWarning from "@ext/localization/actions/OtherLanguagesPresentWarning";
import { shouldShowActionWarning } from "@ext/localization/actions/OtherLanguagesPresentWarning";
import type { NodeModel } from "@minoru/react-dnd-treeview";
import { type ComponentProps, useCallback, useEffect, useRef, useState } from "react";
import type { CategoryLink, ItemLink } from "../../../NavigationLinks";
import DragTreeTransformer from "../logic/DragTreeTransformer";
import LevNavDragTree from "./LevNavDragTree";

type handleOnDropType = (
	draggedItemPath: string,
	newTree: NodeModel<ItemLink>[],
	fetchComplete: () => void,
) => Promise<void> | void;

const ExportLevNavDragTree = ({ items, closeNavigation }: { items: ItemLink[]; closeNavigation?: () => void }) => {
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const articleProps = ArticlePropsService.value;
	const supportedLanguages = useCatalogPropsStore((state) => state.data?.supportedLanguages, "shallow");
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const [dragged, setDragged] = useState<boolean>(!isReadOnly);
	const [treeData, setTreeData] = useState<NodeModel<ItemLink>[]>([]);
	const router = useRouter();

	const treeDataRef = useRef(treeData);
	const articlePropsRef = useRef(articleProps);
	const routerRef = useRef(router);

	const { effectiveItems, openPathsRef } = useNavTreePersistence(catalogName, items);

	const { call: updateCatalogNav } = useDeferApi<NodeModel<ItemLink>[]>({ opts: { mime: MimeTypes.json } });

	// biome-ignore lint/correctness/useExhaustiveDependencies: fine dependencies
	useEffect(() => {
		treeDataRef.current = treeData;
		articlePropsRef.current = articleProps;
		routerRef.current = router;
	}, [treeData, articleProps, router]);

	useEffect(() => {
		setTreeData(DragTreeTransformer.getRenderDragNav(effectiveItems));
	}, [effectiveItems]);

	const handleOnDrop: handleOnDropType = useCallback(
		async (draggedItemPath, newTree, fetchComplete) => {
			if (!DragTreeTransformer.isModified(draggedItemPath, treeDataRef.current, newTree)) return;
			setDragged(false);

			const newItems = await updateCatalogNav({
				url: (api) => api.updateCatalogNav(articlePropsRef.current.ref.path),
				opts: {
					body: { draggedItemPath, old: treeDataRef.current, new: newTree },
					parse: "json",
					mime: MimeTypes.json,
				},
			});
			if (!newItems) return;
			fetchComplete();
			const currentItem = newItems.find((i) => i.data.isCurrentLink);
			if (currentItem) routerRef.current.pushPath(currentItem.data.pathname);
			const preservedItems = newItems.map((node) => {
				if (!node.data?.ref?.path) return node;
				const serverExpanded = (node.data as CategoryLink).isExpanded ?? false;
				const userExpanded = openPathsRef.current.has(node.data.ref.path);
				if (serverExpanded === userExpanded) return node;
				return { ...node, data: { ...node.data, isExpanded: serverExpanded || userExpanded } as ItemLink };
			});
			setTreeData(preservedItems);
			setDragged(true);
		},
		[updateCatalogNav, openPathsRef],
	);

	const onDrop = useCallback(
		(...args: [draggedItemPath: string, newTree: NodeModel<ItemLink>[], fetchComplete: () => void]) => {
			shouldShowActionWarning(supportedLanguages?.length)
				? ModalToOpenService.setValue<ComponentProps<typeof OtherLanguagesPresentWarning>>(
						ModalToOpen.MultilangActionConfirm,
						{
							action: () => handleOnDrop(...args),
							isOpen: true,
							onClose: () => ModalToOpenService.resetValue(),
						},
					)
				: handleOnDrop(...args);
		},
		[supportedLanguages?.length, handleOnDrop],
	);

	const handleOpenChange = useCallback(
		(openIds: Set<number | string>, nodes: NodeModel<ItemLink>[]) => {
			const openPaths = nodes.filter((n) => openIds.has(n.id) && n.data?.ref?.path).map((n) => n.data!.ref.path);
			openPathsRef.current = new Set(openPaths);
			useNavTreeStore.getState().setCatalog(catalogName, openPaths);
		},
		[catalogName, openPathsRef],
	);

	useEffect(() => {
		setDragged(!isReadOnly);
	}, [isReadOnly]);

	return (
		<LevNavDragTree
			canDrag={dragged}
			closeNavigation={closeNavigation}
			items={treeData}
			onDrop={onDrop}
			onOpenChange={handleOpenChange}
		/>
	);
};

export default ExportLevNavDragTree;
