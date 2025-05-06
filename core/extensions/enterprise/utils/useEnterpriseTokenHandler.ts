import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { useRouter } from "@core/Api/useRouter";
import initEnterprise from "@ext/enterprise/utils/initEnterprise";
import { useEffect } from "react";

const useEnterpriseTokenHandler = (isFirstLoad: boolean) => {
	const router = useRouter();
	const { isReadOnly } = PageDataContextService.value.conf;
	const workspace = WorkspaceService.current();
	const apiUrlCreator = ApiUrlCreatorService.value;

	const func = async () => {
		if (!isFirstLoad || isReadOnly) return;
		await initEnterprise(router.query.enterpriseToken, apiUrlCreator, router, workspace);
	};

	useEffect(() => {
		void func();
	}, [isFirstLoad]);
};

export default useEnterpriseTokenHandler;
