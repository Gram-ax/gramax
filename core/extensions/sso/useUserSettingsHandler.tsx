import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import saveUserSettings from "@ext/sso/saveUserSettings";
import { useEffect } from "react";

const useUserSettingsHandler = (isFirstLoad: boolean) => {
	const router = useRouter();
	const { isReadOnly } = PageDataContextService.value.conf;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const func = async () => {
		if (!isFirstLoad || isReadOnly) return;
		await saveUserSettings(router.query.userSettings, apiUrlCreator, router);
	};

	useEffect(() => {
		void func();
	}, [isFirstLoad]);
};

export default useUserSettingsHandler;
