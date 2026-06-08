// biome-ignore lint/style/noRestrictedImports: CSS-only import for theme variables
import "ics-ui-kit/theme.css";
import "../../../core/ui-kit/index.css";
import "../../../core/styles/main.css";
// biome-ignore lint/style/noRestrictedImports: idc
import styled from "@emotion/styled";
import { createRoot } from "react-dom/client";
import App from "../../browser/src/App";
import * as debug from "../../browser/src/debug";
import subscribeEvents from "./events";
import ForwardBackward from "./ForwardBackward";
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

	@media print {
		display: none;
	}
`;

// biome-ignore lint/suspicious/noExplicitAny: idc
window.debug = { ...(debug as any) };

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
