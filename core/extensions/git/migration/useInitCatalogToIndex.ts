import { getExecutingEnvironment } from "@app/resolveModule/env";
import useWatch from "@core-ui/hooks/useWatch";
import CatalogToIndex from "@ext/git/migration/CatalogToIndex";

const useInitCatalogToIndexOnFirstLoad = (isFirstLoad: boolean) => {
	useWatch(() => {
		if (!isFirstLoad || typeof window === "undefined" || CatalogToIndex.hasInit()) return;
		addAllCatalogsToIndex();
	}, [isFirstLoad]);
};

export default useInitCatalogToIndexOnFirstLoad;

export const addAllCatalogsToIndex = () => {
	if (typeof window === "undefined" || getExecutingEnvironment() !== "browser") return;
	const allCatalogs = window.app.wm.current().getAllCatalogs();
	const catalogToIndex = Array.from(allCatalogs.keys());
	CatalogToIndex.setCatalogToIndex(catalogToIndex);
};
