import resolveModule from "@app/resolveModule/frontend";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useSetting } from "@ext/settings/logic/hooks";
import CloudApi from "@ext/static/logic/CloudApi";
import getCloudLoginByLocation from "@ext/static/logic/getCloudLoginByLocation";
import Theme from "@ext/Theme/Theme";
import { useState } from "react";

const useGetCatalogTitleLogo = (catalogName: string, deps: Array<unknown> = []) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [theme] = useSetting("general.theme");
	const { isStatic } = usePlatform();

	const cloudServiceUrl = PageDataContextService.value?.conf.cloudServiceUrl;
	const isInCloud = isStatic && typeof window !== "undefined" && !!cloudServiceUrl;
	const [cloudApi] = useState(() => new CloudApi(cloudServiceUrl));

	const image = resolveModule("useImage")(isInCloud ? null : apiUrlCreator.getLogoUrl(catalogName, theme), deps);

	if (isInCloud) {
		const login = getCloudLoginByLocation(window.location);
		return cloudApi.getCatalogLogoUrl(catalogName, theme ?? Theme.light, login);
	}

	return image;
};

export default useGetCatalogTitleLogo;
