import { invoke } from "@tauri-apps/api/core";
import { once } from "@tauri-apps/api/event";

const openChildWindow = async ({ url, redirect }: { url: string; redirect: string }): Promise<Window> => {
	const dummy = { onLoadApp: undefined, focus: () => {} };
	await once("on_done", (ev) => dummy.onLoadApp({ search: "?" + (ev.payload as string) }));
	if (redirect) {
		await invoke("http_listen_once", {
			url: url.replace(/\?redirect=.*$/, `?redirect=${encodeURIComponent("http://localhost:52054")}`),
			redirect,
			callbackName: "on_done",
		});
	} else window.location.replace(url);

	return dummy as any as Window;
};

export default openChildWindow;
