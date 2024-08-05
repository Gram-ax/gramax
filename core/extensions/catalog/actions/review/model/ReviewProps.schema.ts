/**
 * @see review-edit-props
 */
export interface ReviewProps {
	/**
	 *
	 * @default true
	 * @readOnly true
	 *
	 */
	haveAccess: boolean;
	// /**
	//  * @title Имя
	//  * @format Ivan Ivanov
	//  * @description Укажите имя получателя. Оно сохранится в истории изменений.
	//  *
	//  */
	// name: string;
	// /**
	//  * @title Почта
	//  * @format IvanIvanov@mail.com
	//  * @description Введите почту получателя. Она сохранится в истории изменений, а также будет использоваться как имя [токена для доступа к репозиторию.]($ACCESS_TOKEN_DOCS)
	//  *
	//  */
	// email: string;
}

export default ReviewProps;
