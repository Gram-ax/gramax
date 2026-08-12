import type { Router } from "@core/Api/Router";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import initEnterprise from "@ext/enterprise/utils/initEnterprise";
import { GesCloudApi } from "@ext/enterprise-cloud/GesCloudApi";
import { once } from "@tauri-apps/api/event";
import { httpListenOnce } from "../../../../apps/tauri/src/window/commands";

const gesCloudLogin = async (url: string, apiUrlCreator: ApiUrlCreator, router: Router, gesCloudUrl: string) => {
	const callbackName = `done_${Date.now()}`;
	const unlisten = { once: null };

	const timeout = setTimeout(
		() => {
			unlisten.once?.();
		},
		1000 * 60 * 7,
	);

	unlisten.once = await once<string>(callbackName, async (ev) => {
		const oneTimeCode = ev.payload?.replace?.("&from=http://localhost:52054", "")?.replace("oneTimeCode=", "");

		if (oneTimeCode) {
			const gesCloudApi = new GesCloudApi(gesCloudUrl);
			const receivedUrl = await gesCloudApi.setInitDesktopData(oneTimeCode);
			await FetchService.fetch(apiUrlCreator.setGesCloudUrl(receivedUrl));
		}

		ModalToOpenService.resetValue();
		void initEnterprise(
			router,
			apiUrlCreator.getAddEnterpriseCloudWorkspaceUrl(),
			apiUrlCreator.getCloneEnterpriseCatalogsUrl(),
		);
		clearTimeout(timeout);
	});
	await httpListenOnce({ url, action: { type: "tryClose" }, callbackName });
};

export default gesCloudLogin;
