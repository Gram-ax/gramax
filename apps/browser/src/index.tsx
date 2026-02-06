import "../../../core/styles/main.css";
import { createRoot } from "react-dom/client";
import { AppDesktopGuard } from "./AppDesktopGuard";
import * as debug from "./debug";

declare global {
	interface Window {
		navigateTo?: (path: string) => void;
		resetIsFirstLoad?: () => void;
		desktopOpened?: boolean;
		// biome-ignore lint/suspicious/noExplicitAny: idc
		wasm: any;
		// biome-ignore lint/suspicious/noExplicitAny: idc
		debug: any;
	}
}

declare const __BUILD_ID__: number;
const container = document.getElementById("root");

if (container && Number(container.dataset.buildId) === __BUILD_ID__) {
	window.debug = debug;
	const root = createRoot(container);
	root.render(<AppDesktopGuard />);
} else {
	console.warn("BUILD_ID mismatch; Skip using stale bundle", { html: global.BUILD_ID, bundle: __BUILD_ID__ });
}
