import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import { Router } from "@core/Api/Router";

const initEnterprise = async (token: string, apiUrlCreator: ApiUrlCreator, router: Router) => {
	if (!token) return;
	await FetchService.fetch(apiUrlCreator.getInitEnterpriseUrl(token));
	router.pushPath("/");
	await refreshPage();
};

export default initEnterprise;
