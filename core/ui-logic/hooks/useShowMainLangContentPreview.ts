import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useShowPreviewArticle } from "@ext/localization/core/stores/LocalizationStore";

const useShowMainLangContentPreview = () => {
	const pageProps = PageDataContextService.value;
	const language = useCatalogPropsStore((state) => state.data?.language);

	const showPreviewArticle = useShowPreviewArticle();

	return (
		showPreviewArticle &&
		pageProps?.language.content &&
		!pageProps.conf.isReadOnly &&
		language &&
		pageProps.language.content !== language
	);
};

export default useShowMainLangContentPreview;
