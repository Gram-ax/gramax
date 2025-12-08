import EnterpriseApi from "@ext/enterprise/EnterpriseApi";

const haveInternetAccess = async (gesUrl?: string): Promise<boolean> => {
	if (gesUrl) {
		const enterpriseApi = new EnterpriseApi(gesUrl);
		return await enterpriseApi.check();
	}

	return haveInternetAccessByNavigator();
};

const haveInternetAccessByNavigator = () => {
	if (typeof window === "undefined") return true;
	return window.navigator?.onLine ?? true;
};

export default haveInternetAccess;
