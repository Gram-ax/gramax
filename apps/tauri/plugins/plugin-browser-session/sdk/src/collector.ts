import "./types";

import { createAgentBrowserBridge } from "./collector/bridge";

if (!window.__gxAgentBrowser) {
	window.__gxAgentBrowser = createAgentBrowserBridge(window, document);
}
