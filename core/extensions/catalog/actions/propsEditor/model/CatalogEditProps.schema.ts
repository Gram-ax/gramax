import Style from "@components/HomePage/Groups/model/Style";

/**
 * @title Настройки каталога
 */
export interface CatalogEditProps {
	/**
	 * @title Название
	 * @format Мой каталог
	 */
	title: string;
	/**
	 * @title Название в URL
	 * @format name
	 */
	url: string;
	/**
	 * @title Описание
	 * @format Для личных заметок
	 */
	description?: string;
	/**
	 * @title Стиль
	 * @format blue
	 */
	style?: Style;
	/**
	 * @title Краткое название
	 * @format PN
	 */
	code?: string;
	// /**
	//  * @title Кому доступно
	//  * @format Почта или группа
	//  * @description Укажите, кто сможет просматривать каталог после публикации. Это могут быть группы или отдельные пользователи.
	//  */
	// private?: string[];
}

export default CatalogEditProps;
