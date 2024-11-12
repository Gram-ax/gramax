// import resolveModule from "@app/resolveModule/frontend";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import UiLanguage, { defaultLanguage } from "@ext/localization/core/model/Language";
import { ReactElement, useLayoutEffect } from "react";

const DEFAULT_SELECTED_LANGUAGE: UiLanguage =
	typeof window === "undefined"
		? defaultLanguage
		: UiLanguage[window.navigator?.language?.split("-")?.[0]] ?? defaultLanguage;

const LOCAL_STORAGE_UI_LANGUAGE_KEY = "ui-lang";

export default abstract class LanguageService {
	private static _current = DEFAULT_SELECTED_LANGUAGE;
	private static _callback: (language: UiLanguage) => void;

	static Provider({ language, children }: { language?: UiLanguage; children: ReactElement }): ReactElement {
		useLayoutEffect(() => LanguageService.setupLanguage(), []);
		if (language) LanguageService._current = language;

		return children;
	}

	static setupLanguage() {
		LanguageService._current =
			UiLanguage[typeof window != "undefined" && window.localStorage?.getItem(LOCAL_STORAGE_UI_LANGUAGE_KEY)];
	}

	static setUiLanguage(language: UiLanguage, noemit?: boolean) {
		if (LanguageService._current == language) return;
		window.localStorage.setItem(LOCAL_STORAGE_UI_LANGUAGE_KEY, language);
		LanguageService._current = language;
		!noemit && LanguageService._callback?.(language);
		refreshPage();
	}

	static onLanguageChanged(callback: (language: UiLanguage) => void) {
		LanguageService._callback = callback;
	}

	static currentUi() {
		return LanguageService._current ?? DEFAULT_SELECTED_LANGUAGE;
	}
}

LanguageService.setupLanguage();
