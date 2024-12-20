import ButtonLink from "@components/Molecules/ButtonLink";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import SignInEnterprise from "@ext/enterprise/components/SignInEnterprise";
import SignOutEnterprise from "@ext/enterprise/components/SignOutEnterprise";
import t from "@ext/localization/locale/translate";

const StyledLink = styled.a`
	white-space: nowrap;
`;

const SignInOutEnterprise = () => {
	const workspaceContext = PageDataContextService.value.workspace;
	const currentWorkspaceName = PageDataContextService.value.workspace.current;
	const workspaceConfig = workspaceContext.workspaces.find(
		(workspaceConfig) => workspaceConfig.path === currentWorkspaceName,
	);

	if (workspaceConfig?.isEnterprise)
		return (
			<SignOutEnterprise
				trigger={
					<StyledLink data-qa="qa-clickable">
						<ButtonLink iconCode="log-in" text={t("sing-out")} />
					</StyledLink>
				}
				workspaceConfig={workspaceConfig}
			/>
		);

	return (
		<SignInEnterprise
			trigger={
				<StyledLink data-qa="qa-clickable">
					<ButtonLink iconCode="log-in" text={t("sing-in")} />
				</StyledLink>
			}
		/>
	);
};

export default SignInOutEnterprise;
