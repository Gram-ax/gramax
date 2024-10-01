import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { Router } from "@core/Api/Router";
import saveUserSettings from "@ext/sso/saveUserSettings";
import { invoke } from "@tauri-apps/api/core";
import { once } from "@tauri-apps/api/event";

const enterpriseLogin = async (url: string, apiUrlCreator: ApiUrlCreator, router: Router) => {
	await once("done", (ev) => {
		const userSettings = (ev.payload as string)?.replace("userSettings=", "");
		void saveUserSettings(userSettings, apiUrlCreator, router);
	});
	await invoke("http_listen_once", { url, redirect: "gramax://", callbackName: "done" });
};

export default enterpriseLogin;
