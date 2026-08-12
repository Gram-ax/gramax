import type Cookie from "@ext/cookie/Cookie";
import type WebCookie from "apps/web/src/logic/WebCookie";
import Theme from "./Theme";

const COOKIE_THEME = "theme";

export default class ThemeManager {
	public setTheme(cookie: Cookie, theme: Theme) {
		if (theme?.length) (cookie as WebCookie).set(COOKIE_THEME, theme.toString(), undefined, { encrypt: false });
	}

	public getTheme(cookie: Cookie): Theme {
		try {
			let theme = (cookie as WebCookie).get(COOKIE_THEME, false);
			if (this._checkTheme(theme)) theme = (cookie as WebCookie).get(COOKIE_THEME, true);
			if (theme in Theme) return theme as Theme;
		} catch {}

		return null;
	}

	private _checkTheme(data: string) {
		return data && data.length > Theme.light.length;
	}
}
