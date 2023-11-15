import SourceType from "./SourceType";

interface SourceData {
	/**
	 * @title Имя пользователя
	 * @default ""
	 * @format Ivan Ivanov
	 * @description Будет отображаться в истории изменений.
	 */
	userName: string;
	/**
	 * @title Почта
	 * @default ""
	 * @format ivan.ivanov@mail.com
	 * @description Будет отображаться в истории изменений.
	 */
	userEmail: string;
	/**
	 * @title Тип
	 * @default ""
	 */
	sourceType: SourceType;
}

export default SourceData;
