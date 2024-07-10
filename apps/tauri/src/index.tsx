import "../../../core/styles/ProseMirror.css";
import "../../../core/styles/admonition.css";
import "../../../core/styles/article-alfabeta.css";
import "../../../core/styles/article.css";
import "../../../core/styles/global.css";
import "../../../core/styles/swagger-ui-theme.css";

import { invoke } from "@tauri-apps/api/core";
import { attachConsole } from "@tauri-apps/plugin-log";

import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import { getCurrent } from "@tauri-apps/api/webviewWindow";
import { createRoot } from "react-dom/client";
import App from "../../browser/src/App";
import { initZoom } from "./window/zoom";

const container = document.getElementById("root");
const current = getCurrent();

Promise.all([
	attachConsole(),
	current.listen("reload", () => location.reload()),
	current.listen("refresh", () => refreshPage()),
	initZoom(current),
	(async () => {
		const env = await invoke("read_env");
		window.process = { env } as any;
	})(),
]).then(() => {
	const root = createRoot(container);
	root.render(<App />);
});
