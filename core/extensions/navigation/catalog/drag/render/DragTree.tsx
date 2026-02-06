import { useRouter } from "@core/Api/useRouter";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import type OtherLanguagesPresentWarning from "@ext/localization/actions/OtherLanguagesPresentWarning";
import { shouldShowActionWarning } from "@ext/localization/actions/OtherLanguagesPresentWarning";
import { NodeModel } from "@minoru/react-dnd-treeview";
import React, { type ComponentProps, useCallback, useEffect, useRef, useState } from "react";
import { ItemLink } from "../../../NavigationLinks";
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
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [dragged, setDragged] = useState<boolean>(!isReadOnly);
	const [treeData, setTreeData] = useState<NodeModel<ItemLink>[]>([]);
	const router = useRouter();

	const treeDataRef = useRef(treeData);
	const apiUrlCreatorRef = useRef(apiUrlCreator);
	const articlePropsRef = useRef(articleProps);
	const routerRef = useRef(router);

	useEffect(() => {
		treeDataRef.current = treeData;
		apiUrlCreatorRef.current = apiUrlCreator;
		articlePropsRef.current = articleProps;
		routerRef.current = router;
	}, [treeData, apiUrlCreator, articleProps, router]);

	useEffect(() => {
		setTreeData(DragTreeTransformer.getRenderDragNav(items));
	}, [items]);

	const handleOnDrop: handleOnDropType = useCallback(async (draggedItemPath, newTree, fetchComplete) => {
		if (!DragTreeTransformer.isModified(draggedItemPath, treeDataRef.current, newTree)) return;
		setDragged(false);

		const url = apiUrlCreatorRef.current.updateCatalogNav(articlePropsRef.current.ref.path);
		const body = JSON.stringify({ draggedItemPath, old: treeDataRef.current, new: newTree });
		const res = await FetchService.fetch<NodeModel<ItemLink>[]>(url, body, MimeTypes.json);
		if (!res.ok) return;
		fetchComplete();
		const newItems = await res.json();
		const currentItem = newItems?.find((i) => i.data.isCurrentLink);
		if (currentItem) routerRef.current.pushPath(currentItem.data.pathname);
		setTreeData(newItems);
		setDragged(true);
	}, []);

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

	useEffect(() => {
		setDragged(!isReadOnly);
	}, [isReadOnly]);

	return <LevNavDragTree canDrag={dragged} closeNavigation={closeNavigation} items={treeData} onDrop={onDrop} />;
};

export default ExportLevNavDragTree;
