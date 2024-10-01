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
		properties: props.properties,
		language: props.language,
		// private: props.private,
	};
};

export default getCatalogEditProps;
