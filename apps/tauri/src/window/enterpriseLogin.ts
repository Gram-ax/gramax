import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import { Router } from "@core/Api/Router";
import initEnterprise from "@ext/enterprise/utils/initEnterprise";
import { once } from "@tauri-apps/api/event";
import { httpListenOnce } from "./commands";

const enterpriseLogin = async (url: string, apiUrlCreator: ApiUrlCreator, router: Router) => {
	const callbackName = "done_" + Date.now();
	const unlisten = {
		once: null,
	};

	const timeout = setTimeout(() => {
		unlisten.once?.();
	}, 1000 * 60 * 7);

	unlisten.once = await once<string>(callbackName, (ev) => {
		const oneTimeCode = ev.payload?.replace?.("&from=http://localhost:52054", "")?.replace("oneTimeCode=", "");
		void initEnterprise(oneTimeCode, apiUrlCreator, router);
		clearTimeout(timeout);
	});
	await httpListenOnce({ url, action: { type: "tryClose" }, callbackName });
};

export default enterpriseLogin;
