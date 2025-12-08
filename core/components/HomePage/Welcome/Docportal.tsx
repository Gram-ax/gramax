import {
	PageState,
	PageStateFolderSvg,
	PageStateTitle,
	PageStateDescription,
	PageStateButtonGroup,
	PageStateAction,
} from "@ui-kit/PageState";
import t from "@ext/localization/locale/translate";
import { useRouter } from "@core/Api/useRouter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SignInEnterpriseForm from "@ext/enterprise/components/SignInEnterpriseForm";
import { useSignInEnterprise } from "@ext/enterprise/components/useSignInEnterprise";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureWorkspacePermission } from "@ext/security/logic/Permission/Permissions";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import ThemeService from "@ext/Theme/components/ThemeService";
import Theme from "@ext/Theme/Theme";
import { Icon } from "@ui-kit/Icon";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import { ComponentProps } from "react";
import CloneModal from "@ext/git/actions/Clone/components/CloneModal";

const EnterpriseSignIn = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const router = useRouter();
	const isLogged = PageDataContextService.value.isLogged;
	const authUrl = apiUrlCreator.getAuthUrl(router, isLogged).toString();

	return (
		<PageState>
			<SignInEnterpriseForm authUrl={authUrl} {...useSignInEnterprise({ authUrl })} />
		</PageState>
	);
};

const EmptyWelcome = () => {
	return (
		<PageState>
			<PageStateFolderSvg icon="plus" />
			<PageStateTitle className="text-center">{t("welcome.empty.title")}</PageStateTitle>
			<PageStateDescription>
				{t("welcome.empty.description")}
				<br />
				{t("try-later")}
			</PageStateDescription>
		</PageState>
	);
};

export const DocportalWelcome = () => {
	const workspacePath = WorkspaceService?.current()?.path;
	const isLogged = PageDataContextService.value.isLogged;
	const isEnterprise = PageDataContextService.value.conf.enterprise.gesUrl;
	const canConfigureWorkspace = workspacePath
		? PermissionService.useCheckPermission(configureWorkspacePermission, workspacePath)
		: true;

	if (isEnterprise && !isLogged) return <EnterpriseSignIn />;
	if (!isLogged || !canConfigureWorkspace) return <EmptyWelcome />;

	const logoIcon = ThemeService.value === Theme.dark ? "gramax-dark" : "gramax-light";

	return (
		<PageState>
			<Icon icon={logoIcon} className="w-12 h-12" />
			<PageStateTitle className="text-2xl sm:text-lg text-center">
				{t("welcome.empty-clone.title")}
			</PageStateTitle>
			<PageStateDescription className="text-base sm:text-sm">
				{t("welcome.empty-clone.description")}
			</PageStateDescription>
			<PageStateButtonGroup>
				<PageStateAction
					onPointerDown={() => {
						ModalToOpenService.setValue<ComponentProps<typeof CloneModal>>(ModalToOpen.Clone, {
							onClose: () => {
								ModalToOpenService.resetValue();
							},
						});
					}}
				>
					<Icon icon="cloud-download" />
					<span>{`${t("load")} ${t("catalog.name")}`}</span>
				</PageStateAction>
			</PageStateButtonGroup>
		</PageState>
	);
};
