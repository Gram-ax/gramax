import type { Router } from "@core/Api/Router";
import FetchService from "@core-ui/ApiServices/FetchService";
import type Url from "@core-ui/ApiServices/Types/Url";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { refreshPage } from "@core-ui/utils/initGlobalFuncs";
import type UserSettings from "@ext/enterprise/types/UserSettings";

const initEnterprise = async (router: Router, addWorkspaceUrl: Url, cloneCatalogsUrl: Url) => {
	router.pushPath("/");
	const id = ModalToOpenService.addModal(ModalToOpen.Loading);
	const res = await FetchService.fetch<UserSettings>(addWorkspaceUrl);
	if (!res.ok) {
		ModalToOpenService.removeModal(id);
		return;
	}
	const userSettings = await res.json();
	SourceDataService.value = [userSettings.source];
	await FetchService.fetch(cloneCatalogsUrl, JSON.stringify(userSettings));
	ModalToOpenService.removeModal(id);
	await refreshPage();
};

export default initEnterprise;
