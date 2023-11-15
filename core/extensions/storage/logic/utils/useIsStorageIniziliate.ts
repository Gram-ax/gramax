import CatalogPropsService from "../../../../ui-logic/ContextServices/CatalogProps";
import PageDataContextService from "../../../../ui-logic/ContextServices/PageDataContext";
import getSourceNameByData from "./getSourceNameByData";

const useIsStorageInitialized = (): boolean => {
	const pageProps = PageDataContextService.value;
	const catalogProps = CatalogPropsService.value;
	return pageProps.sourceDatas.map(getSourceNameByData).includes(catalogProps.sourceName);
};

export default useIsStorageInitialized;
