import { ClientCatalogProps } from "../../../../../logic/SitePresenter/SitePresenter";
import CatalogEditProps from "../model/CatalogEditProps.schema";

const getCatalogEditProps = (props: ClientCatalogProps): CatalogEditProps => {
	return {
		title: props.title,
		url: props.name,
		docroot: props.docroot,
		group: props.link?.group,
		properties: props.properties,
		language: props.language,
		versions: props.versions,
		description: props.link?.description,
		style: props.link?.style,
		code: props.link?.code,
	};
};

export default getCatalogEditProps;
