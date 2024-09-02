import Style from "@components/HomePage/Cards/model/Style";
import type { ContentLanguage } from "@ext/localization/core/model/Language";

/**
 * @see catalog-edit-props
 */
export interface CatalogEditProps {
	title: string;
	url: string;
	docroot?: string;
	description?: string;
	/**
	 * @see language
	 */
	language?: ContentLanguage;
	/**
	 * @see catalog.style
	 */
	style?: Style;
	code?: string;
	// /**
	//  * @title Кому доступно
	//  * @format Почта или группа
	//  * @description Укажите, кто сможет просматривать каталог после публикации. Это могут быть группы или отдельные пользователи.
	//  */
	// private?: string[];
}

export default CatalogEditProps;
