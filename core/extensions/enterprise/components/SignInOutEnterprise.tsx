import { UserAvatar } from "@components/Actions/SingInOut";
import Icon from "@components/Atoms/Icon";
import SignInEnterprise from "@ext/enterprise/components/SignInEnterprise";
import t from "@ext/localization/locale/translate";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { IconButton } from "@ui-kit/Button";

interface SignInOutEnterpriseProps {
	onLogoutClick: () => void;
	workspaceConfig: ClientWorkspaceConfig;
}

const SignInOutEnterprise = ({ onLogoutClick, workspaceConfig }: SignInOutEnterpriseProps) => {
	if (workspaceConfig?.enterprise?.gesUrl)
		return (
			<UserAvatar
				logOutComponent={
					<>
						<Icon code="log-out" />
						{t("sing-out")}
					</>
				}
				onLogOutClick={onLogoutClick}
			/>
		);

	return <SignInEnterprise trigger={<IconButton icon="log-in" variant="ghost" />} />;
};

export default SignInOutEnterprise;
