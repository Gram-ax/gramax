import Style from "@components/HomePage/Cards/model/Style";
import type { ContentLanguage } from "@ext/localization/core/model/Language";
import { Property } from "@ext/properties/models";

/**
 * @see catalog-edit-props
 */
export interface CatalogEditProps {
	title: string;
	url: string;
	docroot?: string;
	versions?: string[];
	description?: string;
	group?: string;
	/**
	 * @see language
	 */
	language?: ContentLanguage;
	/**
	 * @see catalog.style
	 */
	style?: Style;
	/**
	 * @see catalog.style
	 */
	code?: string;
	/**
	 * @see catalog.properties
	 */
	properties?: Property[];
	// /**
	//  * @title Who has access
	//  * @format Email or group
	//  * @description Specify who will be able to view the catalog after publishing. This can be groups or individual users.
	//  */
	// private?: string[];
}

export default CatalogEditProps;
