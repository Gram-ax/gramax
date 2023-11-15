import { CatalogProps } from "../../../../../logic/SitePresenter/SitePresenter";
import CatalogEditProps from "../model/CatalogEditProps.schema";

const getCatalogEditProps = (props: CatalogProps): CatalogEditProps => {
	return {
		url: props.name,
		code: props.link.code,
		title: props.title,
		description: props.link.description,
		style: props.link.style,
		private: props.private,
	};
};

export default getCatalogEditProps;
