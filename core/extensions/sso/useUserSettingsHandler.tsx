import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import { useEffect } from "react";

const useUserSettingsHandler = (isFirstLoad: boolean) => {
	const router = useRouter();
	const { isReadOnly } = PageDataContextService.value.conf;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const func = async () => {
		if (!isFirstLoad || isReadOnly || !router.query.userSettings) return;
		await FetchService.fetch(apiUrlCreator.getUserSettingsUrl(router.query.userSettings));
		router.pushPath("/");
		await refreshPage();
	};
	useEffect(() => {
		void func();
	}, [isFirstLoad]);
};

export default useUserSettingsHandler;
