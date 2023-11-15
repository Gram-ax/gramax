/**
 * @title Вход в аккаунт
 */
export interface AdminLayoutProps {
	/**
	 * @title Логин
	 * @format Введите логин
	 */
	login: string;
	/**
	 * @title Пароль
	 * @format Введите пароль
	 * @private true
	 */
	password: string;
}

export default AdminLayoutProps;
