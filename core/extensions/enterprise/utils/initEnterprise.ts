import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { refreshPage } from "@core-ui/utils/initGlobalFuncs";
import { Router } from "@core/Api/Router";
import UserSettings from "@ext/enterprise/types/UserSettings";

const initEnterprise = async (oneTimeCode: string, apiUrlCreator: ApiUrlCreator, router: Router) => {
	if (!oneTimeCode) return;
	router.pushPath("/");
	ModalToOpenService.setValue(ModalToOpen.Loading);
	const res = await FetchService.fetch<UserSettings>(apiUrlCreator.getAddEnterpriseWorkspaceUrl(oneTimeCode));
	ModalToOpenService.resetValue();
	if (!res.ok) return;
	const userSettings = await res.json();
	await FetchService.fetch(apiUrlCreator.getCloneEnterpriseCatalogsUrl(), JSON.stringify(userSettings));
	await refreshPage();
	SourceDataService.refresh();
};

export default initEnterprise;
