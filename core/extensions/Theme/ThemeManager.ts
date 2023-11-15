import Cookie from "../cookie/Cookie";
import Theme from "./Theme";

const COOKIE_THEME = "theme";

export default class ThemeManager {
	public setTheme(cookie: Cookie, theme: Theme) {
		cookie.set(COOKIE_THEME, theme.toString());
	}

	public getTheme(cookie: Cookie): Theme {
		const theme: Theme = cookie.get(COOKIE_THEME) as Theme;
		if (!theme) return null;
		return theme;
	}
}
