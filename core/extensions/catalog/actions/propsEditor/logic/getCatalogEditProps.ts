import { ClientCatalogProps } from "../../../../../logic/SitePresenter/SitePresenter";
import CatalogEditProps from "../model/CatalogEditProps";

const getCatalogEditProps = (props: ClientCatalogProps): CatalogEditProps => {
	const { title, name, docroot, language, versions, syntax, properties, link, filterProperties } = props;

	return {
		title,
		url: name,
		docroot,
		language,
		versions,
		syntax,
		properties,
		group: link?.group,
		description: link?.description,
		filterProperties,
		style: link?.style,
		logo: props.logo,
		logo_dark: props.logo_dark,
	};
};

export default getCatalogEditProps;
