import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { useRouter } from "@core/Api/useRouter";
import initEnterprise from "@ext/enterprise/utils/initEnterprise";
import { useEffect } from "react";

const useEnterpriseTokenHandler = (isFirstLoad: boolean) => {
	const router = useRouter();
	const { isReadOnly } = PageDataContextService.value.conf;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const func = async () => {
		if (!isFirstLoad || isReadOnly) return;
		await initEnterprise(router.query.enterpriseToken, apiUrlCreator, router);
	};

	useEffect(() => {
		void func();
	}, [isFirstLoad]);
};

export default useEnterpriseTokenHandler;
