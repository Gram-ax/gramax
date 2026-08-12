// biome-ignore lint/style/noRestrictedImports: CSS-only import for theme variables
import "ics-ui-kit/theme.css";
import "../../../core/ui-kit/index.css";
import "../../../core/styles/main.css";
import { createRoot } from "react-dom/client";
import { AppDesktopGuard } from "./AppDesktopGuard";
import * as debug from "./debug";

// biome-ignore lint/style/useNamingConvention: expected
declare const __BUILD_ID__: number;

const container = document.getElementById("root");

if (container && Number(container.dataset.buildId) === __BUILD_ID__) {
	// biome-ignore lint/suspicious/noExplicitAny: idc
	window.debug = { ...(debug as any) };
	const root = createRoot(container);
	root.render(<AppDesktopGuard />);
} else {
	console.warn("BUILD_ID mismatch; Skip using stale bundle", { html: global.BUILD_ID, bundle: __BUILD_ID__ });
}
