import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import { useAdminHeader } from "@ext/enterprise/components/admin/hooks/useAdminHeader";
import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import { Page } from "@ext/enterprise/types/Page";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import AccessTokensComponent from "@ext/enterpriseCommon/components/accessTokens/AccessTokensComponent";
import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useEffect, useMemo, useState } from "react";

const GesAccessTokensComponent = () => {
	const gesUrl = PageDataContextService.value.conf.enterprise?.gesUrl;
	const sourceDatas = SourceDataService.value;
	// biome-ignore lint/correctness/useExhaustiveDependencies: it's ok
	const token = useMemo(() => getEnterpriseSourceData(sourceDatas, gesUrl)?.token, [gesUrl, sourceDatas]);
	const enterpriseApi = useMemo(() => new EnterpriseApi(gesUrl), [gesUrl]);

	const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
	const [healthChecking, setHealthChecking] = useState(true);

	useEffect(() => {
		void enterpriseApi
			.healthcheckAccessTokens()
			.then(setIsHealthy)
			.finally(() => setHealthChecking(false));
	}, [enterpriseApi]);

	const getTokens = useMemo(() => () => enterpriseApi.getAccessTokens(token), [enterpriseApi, token]);

	const createToken = useMemo(
		() => (payload: { name: string; expiresAt: string }) => enterpriseApi.createAccessToken(token, payload),
		[enterpriseApi, token],
	);

	const revokeToken = useMemo(
		() => (id: string) => enterpriseApi.revokeAccessToken(token, id),
		[enterpriseApi, token],
	);

	useAdminHeader({
		title: (
			<>
				{getAdminPageTitle(Page.ACCESS_TOKENS)}
				{isHealthy === false && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="p-0 h-auto"
								size="sm"
								startIcon="circle-alert"
								status="error"
								variant="text"
							/>
						</TooltipTrigger>
						<TooltipContent className="font-sans font-normal">
							{t("enterprise.admin.access-tokens.service-unavailable")}
						</TooltipContent>
					</Tooltip>
				)}
			</>
		),
	});

	if (healthChecking) return <TabInitialLoader />;

	if (!isHealthy) return null;

	return <AccessTokensComponent createToken={createToken} getTokens={getTokens} revokeToken={revokeToken} />;
};

export default GesAccessTokensComponent;
