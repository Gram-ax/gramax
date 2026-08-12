import { useNavTreePersistence } from "@core/SitePresenter/NavTreeStateManager";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import {
	navigationTreeStore,
	useNavigationTreeStore,
} from "@ext/navigation/catalog/SidebarNavigation/store/navigationTreeStore";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import { SidebarGroup } from "@ui-kit/Sidebar";
import { useEffect, useLayoutEffect } from "react";
import { ReadonlyNavigationTreeItem } from "./ReadonlyNavigationTreeItem";

export const ReadonlyNavigationTree = ({ items }: { items: ItemLink[] }) => {
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const supportedLanguages = useCatalogPropsStore((state) => state.data?.supportedLanguages, "shallow");
	const treeScope = `${catalogName ?? ""}:${PageDataContextService.value.language.content ?? ""}`;

	const { effectiveItems, toggle } = useNavTreePersistence(catalogName, items, supportedLanguages);

	const { setNavItems, setOnDrop, setOnToggle, flatIndex, rootIds } = useNavigationTreeStore((s) => ({
		setNavItems: s.setNavItems,
		setOnDrop: s.setOnDrop,
		setOnToggle: s.setOnToggle,
		flatIndex: s.flatIndex,
		rootIds: s.rootIds,
	}));

	useLayoutEffect(() => {
		setNavItems(effectiveItems, treeScope);
	}, [effectiveItems, setNavItems, treeScope]);

	useEffect(() => {
		setOnDrop(null);
	}, [setOnDrop]);

	useEffect(() => {
		setOnToggle((id, open) => {
			const path = navigationTreeStore.getState().flatIndex[id]?.ref?.path;
			if (!path) return;
			toggle(path, open);
		});
		return () => setOnToggle(null);
	}, [toggle, setOnToggle]);

	return (
		<div className="relative mt-4 flex flex-col gap-3 [&_li]:mb-0 [&_li]:list-none">
			{rootIds.map((groupId) => {
				const groupData = flatIndex[groupId];
				if (!groupData) return null;

				return (
					<SidebarGroup className="mt-0.5 py-0 px-2.5" key={groupId}>
						<ReadonlyNavigationTreeItem id={groupId} level={1} />
					</SidebarGroup>
				);
			})}
		</div>
	);
};
