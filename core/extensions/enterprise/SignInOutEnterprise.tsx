import ButtonLink from "@components/Molecules/ButtonLink";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SignInEnterprise from "@ext/enterprise/SignInEnterprise";
import SignOutEnterprise from "@ext/enterprise/SignOutEnterprise";
import t from "@ext/localization/locale/translate";

const SignInOutEnterprise = () => {
	const workspaceContext = PageDataContextService.value.workspace;
	const currentWorkspaceName = PageDataContextService.value.workspace.current;
	const workspaceConfig = workspaceContext.workspaces.find(
		(workspaceConfig) => workspaceConfig.path === currentWorkspaceName,
	);

	if (workspaceConfig.isEnterprise)
		return (
			<SignOutEnterprise
				trigger={
					<a data-qa="qa-clickable">
						<ButtonLink iconCode="log-in" text={t("sing-out")} />
					</a>
				}
				workspaceConfig={workspaceConfig}
			/>
		);

	return (
		<SignInEnterprise
			trigger={
				<a data-qa="qa-clickable">
					<ButtonLink iconCode="log-in" text={t("sing-in")} />
				</a>
			}
		/>
	);
};

export default SignInOutEnterprise;
