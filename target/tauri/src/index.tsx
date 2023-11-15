import "@fortawesome/fontawesome-pro/css/all.css";
import "../../../core/styles/ProseMirror.css";
import "../../../core/styles/admonition.css";
import "../../../core/styles/article-alfabeta.css";
import "../../../core/styles/article.css";
import "../../../core/styles/global.css";
import "../../../core/styles/swagger-ui-theme.css";

import { invoke } from "@tauri-apps/api/primitives";
import { listen } from "@tauri-apps/api/event";
import { attachConsole } from "@tauri-apps/plugin-log";

import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "../../browser/src/App";

const container = document.getElementById("root");

const Wrapper = () => {
	const [ready, setReady] = useState(false);

	useEffect(
		() =>
			void (async () => {
				await attachConsole();
				await listen("reload", () => location.reload());
				await listen("refresh", () => refreshPage());

				const env = await invoke("read_env");
				window.process = { env } as any;

				setReady(true);
			})(),
		[],
	);

	return ready && <App />;
};

const root = createRoot(container);
root.render(<Wrapper />);
