import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

const useShowMainLangContentPreview = () => {
	const pageProps = PageDataContextService.value;
	const language = useCatalogPropsStore((state) => state.data.language);
	return (
		pageProps?.language.content && !pageProps.conf.isReadOnly && language && pageProps.language.content != language
	);
};

export default useShowMainLangContentPreview;
