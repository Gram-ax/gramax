import { isTauriMobile } from "@app/resolveModule/env";
import LanguageService from "@core-ui/ContextServices/Language";
import UiLanguage from "@ext/localization/core/model/Language";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import TauriCookie from "./cookie/TauriCookie";
import { attachConsole } from "./logging";
import { initSpellcheck, toggleSpellcheck } from "./spellcheck";
import { initZoom } from "./window/zoom";

const initSettings = async () => {
	const data = await invoke("get_settings");
	if (!data) return;
	TauriCookie.setEncoded(new Map(Object.entries(data as Record<string, string>)));
};

const subscribeEvents = async () => {
	initSpellcheck();
	await attachConsole();
	TauriCookie.onCookieUpdated(
		async (encoded) => await invoke("set_settings", { data: encoded ? Object.fromEntries(encoded) : {} }),
	);
	const current = getCurrentWebviewWindow();
	const env = await invoke("read_env");
	// biome-ignore lint/suspicious/noExplicitAny: idc
	window.process = { env } as any;

	await Promise.all([
		initZoom(current),
		current.listen("on_language_changed", (ev) =>
			LanguageService.setUiLanguage(UiLanguage[ev.payload as string], true),
		),
		current.listen("on_toggle_spellcheck", toggleSpellcheck),
		current.listen("reload", () => location.reload()),
		current.listen("refresh", () => void refreshPage()),
		current.listen("settings-data-updated", (ev) => {
			const data = ev.payload;
			TauriCookie.setEncoded(new Map(data ? Object.entries(data as Record<string, string>) : []));
		}),
		initSettings(),
	]);

	if (!isTauriMobile()) {
		LanguageService.onLanguageChanged((language) => void invoke("set_language", { language }));
		await invoke("set_language", { language: LanguageService.currentUi() });
	}
};

export default subscribeEvents;
