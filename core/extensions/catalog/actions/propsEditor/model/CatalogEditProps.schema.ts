import Style from "@components/HomePage/Cards/model/Style";
import type { ContentLanguage } from "@ext/localization/core/model/Language";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
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
	/**
	 * @see language
	 */
	language?: ContentLanguage;
	filterProperties?: string[];
	/**
	 * @see catalog.style
	 */
	style?: Style;
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
	syntax?: Syntax;
}

export default CatalogEditProps;
