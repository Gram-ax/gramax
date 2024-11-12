import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useState, useLayoutEffect } from "react";
import Theme from "../Theme";

const ThemeContext = createContext<Theme>(undefined);
let _setTheme: Dispatch<SetStateAction<Theme>> = () => {};

abstract class ThemeService {
	static Provider({ children, value }: { children: ReactElement; value?: Theme }): ReactElement {
		const [theme, setTheme] = useState<Theme>();
		_setTheme = setTheme;

		useLayoutEffect(() => {
			const theme = ThemeService.getTheme();
			const verifyValue = ThemeService.checkTheme(value);
			const valueToChange = value && theme !== verifyValue ? verifyValue : theme;

			ThemeService.changeTheme(valueToChange);
		}, []);

		return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
	}

	static Provide({ children, value }: { children: ReactElement; value: Theme }): ReactElement {
		return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
	}

	static get value(): Theme {
		return useContext(ThemeContext);
	}

	static setTheme(theme: Theme, apiUrlCreator?: undefined): void;
	static setTheme(theme: Theme, apiUrlCreator: ApiUrlCreator): Promise<void>;
	public static async setTheme(theme: Theme, apiUrlCreator: ApiUrlCreator) {
		if (apiUrlCreator) await FetchService.fetch(apiUrlCreator.getSetThemeURL(theme));
		ThemeService.changeTheme(theme);
	}

	public static changeTheme(theme: Theme) {
		const verifyTheme = ThemeService.checkTheme(theme);
		_setTheme(verifyTheme);

		document.body.dataset.theme = verifyTheme;
	}
	public static getTheme() {
		const body = document?.body;
		if (!body || !body.dataset) return Theme.dark;
		const bodyTheme = ThemeService.checkTheme(body.dataset.theme);

		return bodyTheme === Theme.dark ? Theme.dark : Theme.light;
	}
	public static async toggleTheme(apiUrlCreator: ApiUrlCreator) {
		const nextTheme = ThemeService.getTheme() === Theme.dark ? Theme.light : Theme.dark;
		await ThemeService.setTheme(nextTheme, apiUrlCreator);
	}

	static checkTheme(data: string): Theme {
		if (data in Theme) return data as Theme;

		return Theme.dark;
	}
}

export default ThemeService;
