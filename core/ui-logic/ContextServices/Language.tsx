import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import UiLanguage, { defaultLanguage } from "@ext/localization/core/model/Language";
import { ReactElement, useEffect } from "react";

const DEFAULT_SELECTED_LANGUAGE: UiLanguage =
	typeof window === "undefined"
		? defaultLanguage
		: UiLanguage[window.navigator?.language?.split("-")?.[0]] ?? defaultLanguage;

const LOCAL_STORAGE_UI_LANGUAGE_KEY = "ui-lang";

export default abstract class LanguageService {
	private static _current = DEFAULT_SELECTED_LANGUAGE;

	static Provider({ children }: { children: ReactElement }): ReactElement {
		useEffect(() => {
			LanguageService._current =
				UiLanguage[window.localStorage.getItem(LOCAL_STORAGE_UI_LANGUAGE_KEY)] ?? DEFAULT_SELECTED_LANGUAGE;
		}, []);

		return children;
	}

	static setUiLanguage(language: UiLanguage) {
		if (LanguageService._current == language) return;
		window.localStorage.setItem(LOCAL_STORAGE_UI_LANGUAGE_KEY, language);
		LanguageService._current = language;
		refreshPage();
	}

	static currentUi() {
		return LanguageService._current ?? DEFAULT_SELECTED_LANGUAGE;
	}
}
