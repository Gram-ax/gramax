import CatalogPropsService from "../../../../ui-logic/ContextServices/CatalogProps";
import PageDataContextService from "../../../../ui-logic/ContextServices/PageDataContext";
import getStorageNameByData from "./getStorageNameByData";

const useIsStorageInitialized = (): boolean => {
	const pageProps = PageDataContextService.value;
	const catalogProps = CatalogPropsService.value;
	if (!catalogProps) return false;
	return pageProps.sourceDatas.map(getStorageNameByData).includes(catalogProps.sourceName);
};

export default useIsStorageInitialized;
