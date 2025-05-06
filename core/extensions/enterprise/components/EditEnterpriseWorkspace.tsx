import Icon from "@components/Atoms/Icon";
import PureLink from "@components/Atoms/PureLink";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { useEffect, useState } from "react";

const EditEnterpriseWorkspace = ({ workspace }: { workspace: ClientWorkspaceConfig }) => {
	const [isConfigValid, setIsConfigValid] = useState(false);
	const pageDataContext = PageDataContextService.value;
	const gesUrl = pageDataContext.conf.enterprise?.gesUrl ?? workspace?.enterprise?.gesUrl;
	const enterpriseSource = pageDataContext.sourceDatas.find((data) => {
		return gesUrl?.includes((data as GitSourceData)?.domain);
	}) as GitSourceData;
	const { isTauri } = usePlatform();

	const checkConfig = async (workspace: ClientWorkspaceConfig, enterpriseSource: GitSourceData, gesUrl: string) => {
		if (!enterpriseSource || !gesUrl || !workspace?.enterprise?.gesUrl) return;
		const isAdmin = await new EnterpriseApi(gesUrl).checkIsAdmin(enterpriseSource.token);
		if (!isAdmin) return;
		setIsConfigValid(true);
	};

	useEffect(() => {
		checkConfig(workspace, enterpriseSource, gesUrl);
	}, [enterpriseSource, gesUrl, workspace?.enterprise?.gesUrl]);

	if (!gesUrl) return null;
	if (!isConfigValid) return null;
	if (!enterpriseSource) return null;
	if (!workspace?.enterprise?.gesUrl) return null;

	return (
		<PureLink href={`${gesUrl}/admin/login`} target={isTauri ? "_self" : "_blank"}>
			<Icon isAction code="pen" />
		</PureLink>
	);
};

export default EditEnterpriseWorkspace;
