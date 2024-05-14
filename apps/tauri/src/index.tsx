import "../../../core/styles/ProseMirror.css";
import "../../../core/styles/admonition.css";
import "../../../core/styles/article-alfabeta.css";
import "../../../core/styles/article.css";
import "../../../core/styles/global.css";
import "../../../core/styles/swagger-ui-theme.css";

import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { attachConsole } from "@tauri-apps/plugin-log";

import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import { createRoot } from "react-dom/client";
import App from "../../browser/src/App";

const container = document.getElementById("root");

Promise.all([
	attachConsole(),
	listen("reload", () => location.reload()),
	listen("refresh", () => refreshPage()),
	(async () => {
		const env = await invoke("read_env");
		window.process = { env } as any;
	})(),
]).then(() => {
	const root = createRoot(container);
	root.render(<App />);
});
