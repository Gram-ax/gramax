import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { Router } from "@core/Api/Router";
import initEnterprise from "@ext/enterprise/utils/initEnterprise";
import { invoke } from "@tauri-apps/api/core";
import { once } from "@tauri-apps/api/event";

const enterpriseLogin = async (url: string, apiUrlCreator: ApiUrlCreator, router: Router) => {
	await once<string>("done", (ev) => {
		const token = ev.payload?.replace?.("&from=http://localhost:52054", "")?.replace("enterpriseToken=", "");
		void initEnterprise(token, apiUrlCreator, router);
	});
	await invoke("http_listen_once", { url, redirect: "gramax://", callbackName: "done" });
};

export default enterpriseLogin;
