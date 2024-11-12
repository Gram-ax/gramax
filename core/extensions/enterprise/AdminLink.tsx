import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import t from "@ext/localization/locale/translate";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { useEffect, useState } from "react";

const AdminLink = ({ workspace }: { workspace: ClientWorkspaceConfig }) => {
	const [isConfigValid, setIsConfigValid] = useState(false);
	const pageDataContext = PageDataContextService.value;
	const gesUrl = pageDataContext.conf.enterprise?.gesUrl ?? workspace?.gesUrl;
	const enterpriseSource = pageDataContext.sourceDatas.find((data) => {
		return gesUrl?.includes((data as GitSourceData)?.domain);
	}) as GitSourceData;

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

	return (
		<Button
			buttonStyle={ButtonStyle.underline}
			onClick={() => {
				if (!enterpriseSource || !gesUrl) return;
				const userInfo = encodeURIComponent(enterpriseSource.token);
				const enterpriseUrl = encodeURIComponent(gesUrl);
				window.open(`${gesUrl}/admin?userInfo=${userInfo}&enterpriseUrl=${enterpriseUrl}`);
			}}
		>
			{t("enterprise.admin-panel")}
		</Button>
	);
};

export default AdminLink;
