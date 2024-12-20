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
	//  * @title Кому доступно
	//  * @format Почта или группа
	//  * @description Укажите, кто сможет просматривать каталог после публикации. Это могут быть группы или отдельные пользователи.
	//  */
	// private?: string[];
}

export default CatalogEditProps;
