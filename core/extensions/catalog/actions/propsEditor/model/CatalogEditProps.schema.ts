import Style from "@components/HomePage/Groups/model/Style";

/**
 * @title Настройки каталога
 */
export interface CatalogEditProps {
	/**
	 * @title Наименование
	 * @format Мой каталог
	 * @description Отображается на главной и в самом каталоге
	 */
	title: string;
	/**
	 * @title Название репозитория
	 * @format name
	 * @description Системное название, задается при создании репозитория. Отображается в URL
	 */
	url: string;
	/**
	 * @title Директория
	 * @format ./
	 * @description Путь до директории с файлами статей
	 */
	docroot?: string;
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
