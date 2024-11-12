import "../../../core/styles/ProseMirror.css";
import "../../../core/styles/admonition.css";
import "../../../core/styles/article-alfabeta.css";
import "../../../core/styles/article.css";
import "../../../core/styles/global.css";
import "../../../core/styles/swagger-ui-theme.css";

import { createRoot } from "react-dom/client";
import { AppDesktopGuard } from "./AppDesktopGuard";
import * as debug from "./debug";

declare global {
	interface Window {
		desktopOpened?: boolean;
	}
}

(window as any).debug = debug;

const container = document.getElementById("root");

const root = createRoot(container);

root.render(<AppDesktopGuard />);
