import { isTauriMobile } from "@app/resolveModule/env";
import { invoke } from "@tauri-apps/api/core";
import { type Webview } from "@tauri-apps/api/webview";

const ZOOM_FACTORS = [67.0, 75.0, 80.0, 90.0, 100.0, 110.0, 125.0, 150.0, 175.0, 200.0].map((n) => n / 100);

const initialLevelIdx = 4;
let levelIdx = initialLevelIdx;

export const initZoom = async (window: Webview) => {
	if (isTauriMobile()) return;

	void invoke("plugin:webview|set_webview_zoom", {
		value: ZOOM_FACTORS[initialLevelIdx],
	});

	await window.listen("zoom-in", () => {
		const value = ZOOM_FACTORS[Math.min(ZOOM_FACTORS.length - 1, ++levelIdx)];
		void invoke("plugin:webview|set_webview_zoom", {
			value,
		});
	});

	await window.listen(
		"zoom-out",
		() =>
			void invoke("plugin:webview|set_webview_zoom", {
				value: ZOOM_FACTORS[Math.max(0, --levelIdx)],
			}),
	);

	await window.listen("actual-size", () => {
		levelIdx = initialLevelIdx;
		void invoke("plugin:webview|set_webview_zoom", { value: 1 });
	});
};
