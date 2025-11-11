import Workspace from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import FavoriteService from "@ext/article/Favorite/components/FavoriteService";
import { useLayoutEffect } from "react";

const useOnCatalogOpen = () => {
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const { isStatic, isStaticCli } = usePlatform();
	const workspace = Workspace.current();

	useLayoutEffect(() => {
		if (!catalogName) return;
		if (!isStatic && !isStaticCli) FavoriteService.fetchFavoriteArticles(workspace.path, catalogName);
	}, [catalogName]);
};

export default useOnCatalogOpen;
