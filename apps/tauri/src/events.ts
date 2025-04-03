import LanguageService from "@core-ui/ContextServices/Language";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import type EditEnterpriseConfig from "@ext/enterprise/components/EditEnterpriseConfig";
import UiLanguage from "@ext/localization/core/model/Language";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow, type WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { attachConsole } from "@tauri-apps/plugin-log";
import type { ComponentProps } from "react";
import TauriCookie from "./cookie/TauriCookie";
import { initZoom } from "./window/zoom";

const subscribeEnterpriseEvents = (current: WebviewWindow) => {
	return current.listen("enterprise-configure", () => {
		if (!window?.app?.em) return;
		ModalToOpenService.setValue<ComponentProps<typeof EditEnterpriseConfig>>(ModalToOpen.EditEnterpriseConfig, {
			config: window.app.em.getConfig(),
			onSave: (config) => void window.app.em.setConfig(config).then(() => window.location.reload()),
		});
	});
};

const initSettings = async () => {
	const data = (await invoke("get_settings")) as any;
	if (!data) return;
	TauriCookie.setEncoded(new Map(Object.entries(data as Record<string, string>)));
};

const subscribeEvents = async () => {
	TauriCookie.onCookieUpdated(
		async (encoded) => await invoke("set_settings", { data: encoded ? Object.fromEntries(encoded) : {} }),
	);
	const current = getCurrentWebviewWindow();
	await attachConsole();
	const env = await invoke("read_env");
	window.process = { env } as any;

	await Promise.all([
		initZoom(current),
		current.listen("on_language_changed", (ev) =>
			LanguageService.setUiLanguage(UiLanguage[ev.payload as string], true),
		),
		current.listen("reload", () => location.reload()),
		current.listen("refresh", () => void refreshPage()),
		subscribeEnterpriseEvents(current),
		current.listen("settings-data-updated", (ev) => {
			const data = ev.payload as any;
			TauriCookie.setEncoded(new Map(data ? Object.entries(data as Record<string, string>) : []));
		}),
		initSettings(),
	]);

	LanguageService.onLanguageChanged((language) => void invoke("set_language", { language }));
	await invoke("set_language", { language: LanguageService.currentUi() });
};

export default subscribeEvents;
