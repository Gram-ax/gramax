import { ClientCatalogProps } from "../../../../../logic/SitePresenter/SitePresenter";
import CatalogEditProps from "../model/CatalogEditProps.schema";

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
		description: link?.description,
		filterProperties,
		style: link?.style,
	};
};

export default getCatalogEditProps;
