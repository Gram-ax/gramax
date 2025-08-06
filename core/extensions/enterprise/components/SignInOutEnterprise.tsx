import { UserAvatar } from "@components/Actions/SingInOut";
import Icon from "@components/Atoms/Icon";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SignInEnterprise from "@ext/enterprise/components/SignInEnterprise";
import SignOutEnterprise from "@ext/enterprise/components/SignOutEnterprise";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";

const SignInOutEnterprise = () => {
	const workspaceContext = PageDataContextService.value.workspace;
	const currentWorkspaceName = PageDataContextService.value.workspace.current;
	const workspaceConfig = workspaceContext.workspaces.find(
		(workspaceConfig) => workspaceConfig.path === currentWorkspaceName,
	);

	if (workspaceConfig?.enterprise?.gesUrl)
		return (
			<UserAvatar
				logOutComponent={
					<SignOutEnterprise
						trigger={
							<div className="flex items-center gap-2 w-full" data-qa="qa-clickable">
								<Icon code="log-out" />
								{t("sing-out")}
							</div>
						}
						workspaceConfig={workspaceConfig}
					/>
				}
			/>
		);

	return <SignInEnterprise trigger={<IconButton variant="ghost" icon="log-in" />} />;
};

export default SignInOutEnterprise;
