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
import * as debug from "../../browser/src/debug";
import { initZoom } from "./window/zoom";

import LanguageService from "@core-ui/ContextServices/Language";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import styled from "@emotion/styled";
import EditEnterpriseConfig from "@ext/enterprise/components/EditEnterpriseConfig";
import UiLanguage from "@ext/localization/core/model/Language";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { ComponentProps } from "react";

const DragableArea = styled.div`
	user-select: none;
	position: absolute;
	top: 0;
	left: 0;
	width: 100vw;
	height: 1.45rem;
	background-color: transparent;
	z-index: var(--z-index-foreground);
`;

window.debug = debug;

window.addEventListener("load", async () => {
	const isMacOS = navigator.userAgent.includes("Mac");

	const current = getCurrentWebviewWindow();
	await attachConsole();
	const env = await invoke("read_env");
	initZoom(current);
	window.process = { env } as any;

	const languageChanged = (ev: any) => LanguageService.setUiLanguage(UiLanguage[ev.payload as string], true);
	current.listen("on_language_changed", languageChanged);
	current.listen("reload", () => location.reload());
	current.listen("refresh", () => refreshPage());
	current.listen("enterprise-configure", () => {
		if (!window?.app?.em) return;
		ModalToOpenService.setValue<ComponentProps<typeof EditEnterpriseConfig>>(ModalToOpen.EditEnterpriseConfig, {
			config: window.app.em.getConfig(),
			onSave: (config) => {
				window.app.em.setConfig(config);
				window.location.reload();
			},
		});
	});

	LanguageService.onLanguageChanged((language) => invoke("set_language", { language }));
	await invoke("set_language", { language: LanguageService.currentUi() });

	const container = document.getElementById("root");
	const root = createRoot(container);
	root.render(
		<>
			<App />
			{isMacOS && <DragableArea data-tauri-drag-region />}
		</>,
	);
});
