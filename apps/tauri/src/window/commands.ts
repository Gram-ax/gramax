import { invoke } from "@tauri-apps/api/core";
import { once } from "@tauri-apps/api/event";
import { getAllWebviews } from "@tauri-apps/api/webview";

export type HttpListenOnceAction = { type: "redirect"; value: string } | { type: "tryClose" };

export interface HttpListenOnceOptions {
	url: string;
	action: HttpListenOnceAction;
	callbackName: string;
}

export const httpListenOnce = async (opts: HttpListenOnceOptions) => {
	await invoke("http_listen_once", {
		url: opts.url.replace(/redirect=.*$/, `redirect=${encodeURIComponent("http://localhost:52054")}`),
		action: opts.action,
		callbackName: "on_done",
	});
};

export const openChildWindow = async (opts: { url: string; redirect?: string }): Promise<Window> => {
	const dummy = { onLoadApp: undefined, focus: () => {} };
	await once("on_done", (ev) => dummy.onLoadApp({ search: "?" + (ev.payload as string) }));

	if (opts.redirect) {
		httpListenOnce({
			url: opts.url,
			action: { type: "redirect", value: opts.redirect },
			callbackName: "on_done",
		});
	} else {
		window.location.replace(opts.url);
	}

	return dummy as any as Window;
};

export const openDirectory = () => invoke<string>("open_directory");

type HttpResponseBody = { type: "text"; data: string } | { type: "binary"; data: Array<number> };

export const httpFetch = (req: {
	url: string;
	body?: string;
	method?: string;
	headers?: { [name: string]: string };
	auth?: { token?: string } | { login?: string; password?: string };
}): Promise<{
	body?: HttpResponseBody;
	contentType?: string;
	status: number;
}> => {
	return invoke("http_request", { req });
};

export const moveToTrash = (path: string) => invoke<void>("move_to_trash", { path });

export const openInExplorer = (path: string) => invoke<void>("open_in_explorer", { path });

export const setSessionData = (key: string, data: string) => invoke<void>("set_session_data", { key, data });

export const openWindowWithUrl = (url: string) => invoke<void>("open_window_with_url", { url });

export const setBadge = (count: number | null) => invoke<void>("set_badge", { count });

export const updateCheck = async (clearCache: boolean) => {
	if (clearCache) await invoke<void>("update_cache_clear");
	await invoke<void>("update_check");
};

export const updateInstall = () => invoke<void>("update_install");

export const updateCacheClear = () => invoke<void>("update_cache_clear");

export const updateInstallByPath = () => invoke<void>("update_install_by_path");

const reloadAll = async () => {
	const webviews = await getAllWebviews();
	for (const webview of webviews) setTimeout(() => void webview.emit("reload"), 100);
};

export const restartApp = () => invoke<void>("restart_app");

Object.assign(window, {
	updateCheck,
	updateInstall,
	updateCacheClear,
	updateInstallByPath,
	setBadge,
	reloadAll,
	restartApp,
});
