import { useRouter } from "@core/Api/useRouter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import initEnterprise from "@ext/enterprise/utils/initEnterprise";
import { useEffect } from "react";

const useEnterpriseTokenHandler = (isFirstLoad: boolean) => {
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isReadOnly } = PageDataContextService.value.conf;

	// biome-ignore lint/correctness/useExhaustiveDependencies: its ok
	useEffect(() => {
		if (!isFirstLoad || isReadOnly) return;
		void initEnterprise(router.query.oneTimeCode, apiUrlCreator, router);
	}, [isFirstLoad]);
};

export default useEnterpriseTokenHandler;
