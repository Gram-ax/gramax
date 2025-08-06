import "ics-ui-kit/styles.css";
import "../../../core/styles/ProseMirror.css";
import "../../../core/styles/admonition.css";
import "../../../core/styles/article-alfabeta.css";
import "../../../core/styles/article.css";
import "../../../core/styles/global.css";
import "../../../core/styles/swagger-ui-theme.css";

import styled from "@emotion/styled";
import { createRoot } from "react-dom/client";
import App from "../../browser/src/App";
import * as debug from "../../browser/src/debug";
import ForwardBackward from "./ForwardBackward";
import subscribeEvents from "./events";
import UpdateChecker from "./update/UpdateChecker";

const DragableArea = styled.div`
	user-select: none;
	position: absolute;
	top: 0;
	left: 0;
	width: 100vw;
	height: 1.45rem;
	background-color: transparent;
	z-index: var(--z-index-top-menu-dragable-area);
`;

window.debug = debug;

window.addEventListener("load", async () => {
	await subscribeEvents();

	const isMacOS = navigator.userAgent.includes("Mac");

	const container = document.getElementById("root");
	const root = createRoot(container);

	root.render(
		<>
			<ForwardBackward />
			<App />
			<UpdateChecker />
			{isMacOS && <DragableArea data-tauri-drag-region />}
		</>,
	);
});
