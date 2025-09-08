import { PageProps } from "@components/ContextProviders";
import ContextService from "@core-ui/ContextServices/ContextService";
import UiLanguage, { resolveLanguage } from "@ext/localization/core/model/Language";
import { ReactElement } from "react";

const DEFAULT_SELECTED_LANGUAGE =
	typeof window === "undefined"
		? resolveLanguage()
		: resolveLanguage(UiLanguage[window.navigator?.language?.split("-")?.[0]]);

const LOCAL_STORAGE_UI_LANGUAGE_KEY = "ui-lang";

class LanguageService implements ContextService {
	private _current = DEFAULT_SELECTED_LANGUAGE;
	private _callback: (language: UiLanguage) => void;

	Init({ pageProps, children }: { pageProps?: PageProps; children: ReactElement }): ReactElement {
		const language = pageProps?.context?.language?.ui;
		if (language) this._current = language;
		return children;
	}

	setupLanguage() {
		this._current =
			UiLanguage[typeof window != "undefined" && window.localStorage?.getItem(LOCAL_STORAGE_UI_LANGUAGE_KEY)];
	}

	setUiLanguage(language: UiLanguage, noemit?: boolean) {
		if (this._current == language) return;
		window.localStorage.setItem(LOCAL_STORAGE_UI_LANGUAGE_KEY, language);
		this._current = language;
		!noemit && this._callback?.(language);
		refreshPage();
	}

	onLanguageChanged(callback: (language: UiLanguage) => void) {
		this._callback = callback;
	}

	currentUi() {
		return this._current ?? DEFAULT_SELECTED_LANGUAGE;
	}
}

const languageService = new LanguageService();
languageService.setupLanguage();
export default languageService;
