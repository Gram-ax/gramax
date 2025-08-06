import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { Router } from "@core/Api/Router";
import initEnterprise from "@ext/enterprise/utils/initEnterprise";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { once } from "@tauri-apps/api/event";
import { httpListenOnce } from "./commands";

const enterpriseLogin = async (
	url: string,
	apiUrlCreator: ApiUrlCreator,
	router: Router,
	workspace: ClientWorkspaceConfig,
) => {
	await once<string>("done", (ev) => {
		const token = ev.payload?.replace?.("&from=http://localhost:52054", "")?.replace("enterpriseToken=", "");
		void initEnterprise(token, apiUrlCreator, router, workspace);
	});
	await httpListenOnce({ url, action: { type: "tryClose" }, callbackName: "done" });
};

export default enterpriseLogin;
