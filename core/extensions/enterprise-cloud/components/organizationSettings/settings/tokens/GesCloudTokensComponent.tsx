import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { GesCloudApi } from "@ext/enterprise-cloud/GesCloudApi";
import { useMemo } from "react";
import AccessTokensComponent from "../../../../../enterpriseCommon/components/accessTokens/AccessTokensComponent";

const GesCloudTokensComponent = () => {
	const { url: gesCloudUrl } = PageDataContextService.value.conf.enterpriseCloud;
	const gesCloudApi = useMemo(() => new GesCloudApi(gesCloudUrl), [gesCloudUrl]);

	const getTokens = useMemo(() => () => gesCloudApi.getTokens(), [gesCloudApi]);

	const createToken = useMemo(
		() => (payload: { name: string; expiresAt: string }) => gesCloudApi.createToken(payload),
		[gesCloudApi],
	);

	const revokeToken = useMemo(() => (id: string | number) => gesCloudApi.revokeToken(id as number), [gesCloudApi]);

	return <AccessTokensComponent createToken={createToken} getTokens={getTokens} revokeToken={revokeToken} />;
};

export default GesCloudTokensComponent;
