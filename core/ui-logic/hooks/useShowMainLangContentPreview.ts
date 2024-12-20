import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";

const useShowMainLangContentPreview = () => {
	const pageProps = PageDataContextService.value;
	const props = CatalogPropsService.value;
	return (
		pageProps?.language.content &&
		!pageProps.conf.isReadOnly &&
		props.language &&
		pageProps.language.content != props.language
	);
};

export default useShowMainLangContentPreview;
