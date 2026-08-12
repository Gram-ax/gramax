import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import CloudApi from "@ext/static/logic/CloudApi";
import getCloudLoginByLocation from "@ext/static/logic/getCloudLoginByLocation";
import { useCallback, useRef } from "react";

const useValidateDeleteCatalogInStatic = () => {
	const { cloudServiceUrl } = PageDataContextService.value.conf;
	const validationRef = useRef<{ cloudServiceUrl: string; validation: Promise<boolean> }>();

	return useCallback(async () => {
		if (validationRef.current?.cloudServiceUrl !== cloudServiceUrl) {
			const cloudApi = new CloudApi(cloudServiceUrl, (e) => ErrorConfirmService.notify(e));
			const validation = cloudApi.getAuthClientName().then((login) => {
				if (!login) return false;
				const locationLogin = getCloudLoginByLocation(window.location);
				return locationLogin === login;
			});
			validationRef.current = { cloudServiceUrl, validation };
		}

		return validationRef.current.validation;
	}, [cloudServiceUrl]);
};

export default useValidateDeleteCatalogInStatic;
