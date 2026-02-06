import { useRouter } from "@core/Api/useRouter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import initEnterprise from "@ext/enterprise/utils/initEnterprise";
import { useEffect } from "react";

const useEnterpriseTokenHandler = (isFirstLoad: boolean) => {
	const router = useRouter();
	const { isReadOnly } = PageDataContextService.value.conf;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const func = async () => {
		if (!isFirstLoad || isReadOnly) return;
		await initEnterprise(router.query.oneTimeCode, apiUrlCreator, router);
	};

	useEffect(() => {
		void func();
	}, [isFirstLoad]);
};

export default useEnterpriseTokenHandler;
