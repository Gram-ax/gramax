import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { Router } from "@core/Api/Router";

const saveUserSettings = async (userSettings: string, apiUrlCreator: ApiUrlCreator, router: Router) => {
	if (!userSettings) return;
	await FetchService.fetch(apiUrlCreator.getUserSettingsUrl(userSettings));
	router.pushPath("/");
	await refreshPage();
};

export default saveUserSettings;
