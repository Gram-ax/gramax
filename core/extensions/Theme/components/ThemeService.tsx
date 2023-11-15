import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useEffect, useState } from "react";
import Theme from "../Theme";

const ThemeContext = createContext<Theme>(undefined);
let _setTheme: Dispatch<SetStateAction<Theme>>;

abstract class ThemeService {
	static Provider({ children, value }: { children: ReactElement; value: Theme }): ReactElement {
		const [theme, setTheme] = useState<Theme>(value);
		_setTheme = setTheme;

		useEffect(() => {
			ThemeService.setTheme(value);
		}, [value]);

		useEffect(() => {
			if (theme) return;
			const isDarkTheme = window.matchMedia("(prefers-color-scheme:dark)").matches;
			ThemeService.setTheme(isDarkTheme ? Theme.dark : Theme.light);
		}, []);

		return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
	}

	static get value(): Theme {
		return useContext(ThemeContext);
	}

	public static async setTheme(theme: Theme, apiUrlCreator?: ApiUrlCreator) {
		_setTheme(theme);
		if (apiUrlCreator) await FetchService.fetch(apiUrlCreator.getSetThemeURL(theme));
		ThemeService.changeTheme(theme);
	}

	public static changeTheme(theme: Theme) {
		document.documentElement.className = ThemeService._getThemeClassName(theme);
	}

	public static async toggleTheme(apiUrlCreator: ApiUrlCreator) {
		const dark = ThemeService._getThemeClassName(Theme.dark);
		const next = document.documentElement.className == dark ? Theme.light : Theme.dark;
		await ThemeService.setTheme(next, apiUrlCreator);
	}

	private static _getThemeClassName(theme: Theme) {
		return "theme-" + theme;
	}
}

export default ThemeService;
