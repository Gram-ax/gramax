import Icon from "@components/Atoms/Icon";
import PureLink from "@components/Atoms/PureLink";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { useEffect, useState } from "react";

const EditEnterpriseWorkspace = ({ workspace }: { workspace: ClientWorkspaceConfig }) => {
	const [isConfigValid, setIsConfigValid] = useState(false);
	const pageDataContext = PageDataContextService.value;
	const gesUrl = pageDataContext.conf.enterprise?.gesUrl ?? workspace?.gesUrl;
	const enterpriseSource = pageDataContext.sourceDatas.find((data) => {
		return gesUrl?.includes((data as GitSourceData)?.domain);
	}) as GitSourceData;
	const { isTauri } = usePlatform();

	const checkConfig = async (workspace: ClientWorkspaceConfig, enterpriseSource: GitSourceData, gesUrl: string) => {
		if (!enterpriseSource || !workspace?.isEnterprise || !gesUrl) return;
		const url = `${gesUrl}/enterprise/config/check?token=${encodeURIComponent(enterpriseSource.token)}`;
		try {
			const res = await fetch(url);
			if (res.status === 200) setIsConfigValid(true);
		} catch (e) {
			setIsConfigValid(false);
		}
	};

	useEffect(() => {
		checkConfig(workspace, enterpriseSource, gesUrl);
	}, [workspace?.isEnterprise, enterpriseSource, gesUrl]);

	if (!gesUrl) return null;
	if (!isConfigValid) return null;
	if (!enterpriseSource) return null;
	if (!workspace?.isEnterprise) return null;

	const userInfo = encodeURIComponent(enterpriseSource.token);
	const enterpriseUrl = encodeURIComponent(gesUrl);
	return (
		<PureLink
			href={`${gesUrl}/admin?userInfo=${userInfo}&enterpriseUrl=${enterpriseUrl}`}
			target={isTauri ? "_self" : "_blank"}
		>
			<Icon isAction code="pen" />
		</PureLink>
	);
};

export default EditEnterpriseWorkspace;
