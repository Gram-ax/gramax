import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import { Router } from "@core/Api/Router";
import UserSettings from "@ext/enterprise/types/UserSettings";

const initEnterprise = async (token: string, apiUrlCreator: ApiUrlCreator, router: Router) => {
	if (!token) return;
	router.pushPath("/");
	ModalToOpenService.setValue(ModalToOpen.Loading);
	const res = await FetchService.fetch<UserSettings>(apiUrlCreator.getAddEnterpriseWorkspaceUrl(token));
	ModalToOpenService.resetValue();
	if (!res.ok) return;
	const userSettings = await res.json();
	await FetchService.fetch(apiUrlCreator.getCloneEnterpriseCatalogsUrl(token), JSON.stringify(userSettings));
	await refreshPage();
};

export default initEnterprise;
