import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { Router } from "@core/Api/Router";
import initEnterprise from "@ext/enterprise/initEnterprise";
import { invoke } from "@tauri-apps/api/core";
import { once } from "@tauri-apps/api/event";

const enterpriseLogin = async (url: string, apiUrlCreator: ApiUrlCreator, router: Router) => {
	await once("done", (ev) => {
		const token = (ev.payload as string)?.replace("enterpriseToken=", "");
		void initEnterprise(token, apiUrlCreator, router);
	});
	await invoke("http_listen_once", { url, redirect: "gramax://", callbackName: "done" });
};

export default enterpriseLogin;
