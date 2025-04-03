import BrowserCookie from "@app/../apps/browser/src/logic/BrowserCookie";
import Cookie from "@ext/cookie/Cookie";
import Theme from "./Theme";

const COOKIE_THEME = "theme";

export default class ThemeManager {
	public setTheme(cookie: Cookie, theme: Theme) {
		if (theme?.length) (cookie as BrowserCookie).set(COOKIE_THEME, theme.toString(), undefined, { encrypt: false });
	}

	public getTheme(cookie: Cookie): Theme {
		try {
			let theme = (cookie as BrowserCookie).get(COOKIE_THEME, false);
			if (this._checkTheme(theme)) theme = (cookie as BrowserCookie).get(COOKIE_THEME, true);
			if (theme in Theme) return theme as Theme;
		} catch {}

		return null;
	}

	private _checkTheme(data: string) {
		return data && data.length > Theme.light.length;
	}
}
