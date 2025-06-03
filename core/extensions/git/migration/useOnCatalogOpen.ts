import { getExecutingEnvironment } from "@app/resolveModule/env";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import useWatch from "@core-ui/hooks/useWatch";
import CatalogToIndex from "@ext/git/migration/CatalogToIndex";

const useOnCatalogOpen = () => {
	const catalogName = CatalogPropsService.value?.name;

	useWatch(() => {
		if (!catalogName || typeof window === "undefined" || getExecutingEnvironment() !== "browser") return;
		const catalogToIndex = CatalogToIndex.getCatalogToIndex();
		if (!catalogToIndex.includes(catalogName)) return;
		void (async () => {
			await window.commands.versionControl.addAll.do({ catalogName });
			CatalogToIndex.removeCatalogFromIndex(catalogName);
		})();
	}, [catalogName]);
};

export default useOnCatalogOpen;
