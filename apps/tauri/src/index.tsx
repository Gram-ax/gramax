import "../../../core/styles/ProseMirror.css";
import "../../../core/styles/admonition.css";
import "../../../core/styles/article-alfabeta.css";
import "../../../core/styles/article.css";
import "../../../core/styles/global.css";
import "../../../core/styles/swagger-ui-theme.css";

import { invoke } from "@tauri-apps/api/core";
import { attachConsole } from "@tauri-apps/plugin-log";

import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import { createRoot } from "react-dom/client";
import App from "../../browser/src/App";
import { initZoom } from "./window/zoom";

import LanguageService from "@core-ui/ContextServices/Language";
import UiLanguage from "@ext/localization/core/model/Language";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const container = document.getElementById("root");
const current = getCurrentWebviewWindow();

Promise.all([
	attachConsole(),
	current.listen("on_language_changed", (ev) =>
		LanguageService.setUiLanguage(UiLanguage[ev.payload as string], true),
	),
	LanguageService.onLanguageChanged((language) => invoke("set_language", { language })),
	current.listen("reload", () => location.reload()),
	current.listen("refresh", () => refreshPage()),
	initZoom(current),
	(async () => {
		const env = await invoke("read_env");
		await invoke("set_language", { language: LanguageService.currentUi() });
		window.process = { env } as any;
	})(),
]).then(() => {
	const root = createRoot(container);
	root.render(<App />);
});
