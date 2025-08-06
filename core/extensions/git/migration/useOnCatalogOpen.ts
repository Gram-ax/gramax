import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import Workspace from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import FavoriteService from "@ext/artilce/Favorite/components/FavoriteService";
import { useLayoutEffect } from "react";

const useOnCatalogOpen = () => {
	const catalogName = CatalogPropsService.value?.name;
	const { isStatic, isStaticCli } = usePlatform();
	const workspace = Workspace.current();

	useLayoutEffect(() => {
		if (!catalogName) return;
		if (!isStatic && !isStaticCli) FavoriteService.fetchFavoriteArticles(workspace.path, catalogName);
	}, [catalogName]);
};

export default useOnCatalogOpen;
