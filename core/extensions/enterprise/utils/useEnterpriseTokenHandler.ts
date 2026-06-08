import { useRouter } from "@core/Api/useRouter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import initEnterprise from "@ext/enterprise/utils/initEnterprise";
import { useEffect } from "react";

const useEnterpriseTokenHandler = (isFirstLoad: boolean) => {
	const router = useRouter();
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isReadOnly } = PageDataContextService.value.conf;
	const { url: gesCloudUrl } = PageDataContextService.value.conf.enterpriseCloud;

	// biome-ignore lint/correctness/useExhaustiveDependencies: its ok
	useEffect(() => {
		const oneTimeCode = router.query.oneTimeCode;
		const initCloud = router.query.initCloud;

		if (isFirstLoad && !isReadOnly) {
			if (gesCloudUrl && initCloud) {
				void initEnterprise(
					router,
					apiUrlCreator.getAddEnterpriseCloudWorkspaceUrl(),
					apiUrlCreator.getCloneEnterpriseCatalogsUrl(),
				);
			} else if (oneTimeCode) {
				void initEnterprise(
					router,
					apiUrlCreator.getAddEnterpriseWorkspaceUrl(oneTimeCode),
					apiUrlCreator.getCloneEnterpriseCatalogsUrl(),
				);
			}
		}
	}, [isFirstLoad]);
};

export default useEnterpriseTokenHandler;
