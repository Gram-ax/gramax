import { ClientCatalogProps } from "../../../../../logic/SitePresenter/SitePresenter";
import CatalogEditProps from "../model/CatalogEditProps";

const getCatalogEditProps = (props: ClientCatalogProps): CatalogEditProps => {
	const { title, name, docroot, language, versions, syntax, properties, link, filterProperty } = props;

	return {
		title,
		url: name,
		docroot,
		language,
		versions,
		syntax,
		properties,
		description: link?.description,
		filterProperty: filterProperty || null,
		style: link?.style,
		logo: props.logo,
		logo_dark: props.logo_dark,
	};
};

export default getCatalogEditProps;
