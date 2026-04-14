import type { Router } from "@core/Api/Router";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { refreshPage } from "@core-ui/utils/initGlobalFuncs";
import type UserSettings from "@ext/enterprise/types/UserSettings";

const initEnterprise = async (oneTimeCode: string, apiUrlCreator: ApiUrlCreator, router: Router) => {
	if (!oneTimeCode) return;
	router.pushPath("/");
	const id = ModalToOpenService.addModal(ModalToOpen.Loading);
	const res = await FetchService.fetch<UserSettings>(apiUrlCreator.getAddEnterpriseWorkspaceUrl(oneTimeCode));
	if (!res.ok) {
		ModalToOpenService.removeModal(id);
		return;
	}
	const userSettings = await res.json();
	await FetchService.fetch(apiUrlCreator.getCloneEnterpriseCatalogsUrl(), JSON.stringify(userSettings));
	ModalToOpenService.removeModal(id);
	await refreshPage();
	SourceDataService.refresh();
};

export default initEnterprise;
