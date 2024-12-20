import { ClientCatalogProps } from "../../../../../logic/SitePresenter/SitePresenter";
import CatalogEditProps from "../model/CatalogEditProps.schema";

const getCatalogEditProps = (props: ClientCatalogProps): CatalogEditProps => {
	return {
		url: props.name,
		code: props.link?.code,
		docroot: props.docroot,
		title: props.title,
		description: props.link?.description,
		style: props.link?.style,
		group: props.link?.group,
		properties: props.properties,
		language: props.language,
		versions: props.versions,
	};
};

export default getCatalogEditProps;
