import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import CloudApi from "@ext/static/logic/CloudApi";
import getCloudLoginByLocation from "@ext/static/logic/getCloudLoginByLocation";
import { useCallback } from "react";

const useValidateDeleteCatalogInStatic = () => {
	const { cloudServiceUrl } = PageDataContextService.value.conf;

	return useCallback(async () => {
		const cloudApi = new CloudApi(cloudServiceUrl, (e) => ErrorConfirmService.notify(e));
		const login = await cloudApi.getAuthClientName();
		if (!login) return false;
		const locationLogin = getCloudLoginByLocation(window.location);
		return locationLogin === login;
	}, [cloudServiceUrl]);
};

export default useValidateDeleteCatalogInStatic;
