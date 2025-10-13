import { UserAvatar } from "@components/Actions/SingInOut";
import Icon from "@components/Atoms/Icon";
import SignInEnterprise from "@ext/enterprise/components/SignInEnterprise";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";

interface SignInOutEnterpriseProps {
	onLogoutClick: () => void;
	workspaceConfig: ClientWorkspaceConfig;
}

const SignInOutEnterprise = ({ onLogoutClick, workspaceConfig }: SignInOutEnterpriseProps) => {
	if (workspaceConfig?.enterprise?.gesUrl)
		return (
			<UserAvatar
				onLogOutClick={onLogoutClick}
				logOutComponent={
					<>
						<Icon code="log-out" />
						{t("sing-out")}
					</>
				}
			/>
		);

	return <SignInEnterprise trigger={<IconButton variant="ghost" icon="log-in" />} />;
};

export default SignInOutEnterprise;
