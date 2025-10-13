import resolveModule from "@app/resolveModule/frontend";
import Welcome from "@components/Welcome";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureWorkspacePermission, editCatalogPermission } from "@ext/security/logic/Permission/Permissions";
import { ComponentProps, type HTMLAttributes } from "react";
import CreateCatalog from "../../extensions/catalog/actions/CreateCatalog";
import Button from "../Atoms/Button/Button";
import CloneModal from "@ext/git/actions/Clone/components/CloneModal";
import {
	PageState,
	PageStateAction,
	PageStateButtonGroup,
	PageStateDescription,
	PageStateFolderSvg,
	PageStateTitle,
} from "@ui-kit/PageState";
import { useSignInEnterprise } from "@ext/enterprise/components/useSignInEnterprise";
import SignInEnterpriseForm from "@ext/enterprise/components/SignInEnterpriseForm";
import { Icon } from "@ui-kit/Icon";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ThemeService from "@ext/Theme/components/ThemeService";
import Theme from "@ext/Theme/Theme";
import { useRouter } from "@core/Api/useRouter";
import LegacyIcon from "@components/Atoms/Icon";
import ImportModal from "@ext/import/components/ImportModal";

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

const DocportalWelcome = () => {
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

const EditorWelcome = () => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const hasWorkspace = !!PageDataContextService.value.workspace.current;
	const workspacePath = WorkspaceService?.current()?.path;
	const { isStatic } = usePlatform();

	const canEditCatalog = workspacePath
		? PermissionService.useCheckPermission(editCatalogPermission, workspacePath)
		: true;

	const canAddCatalog = (() => {
		if (isStatic) return false;
		return canEditCatalog;
	})();

	return (
		<div className="article">
			<Welcome
				title={t("so-far-its-empty")}
				actions={
					canAddCatalog && (
						<>
							<IsReadOnlyHOC>
								<CreateCatalog
									trigger={
										<Button fullWidth>
											<LegacyIcon code="plus" viewBox="3 3 18 18" />
											<span>{t("catalog.new")}</span>
										</Button>
									}
								/>
							</IsReadOnlyHOC>
							<CloneModal
								trigger={
									<Button fullWidth>
										<LegacyIcon code="cloud-download" />
										<span>{`${t("catalog.clone")}`}</span>
									</Button>
								}
							/>
							<IsReadOnlyHOC>
								<ImportModal
									trigger={
										<Button fullWidth>
											<LegacyIcon code="import" />
											<span>{`${t("catalog.import")}`}</span>
										</Button>
									}
								/>
							</IsReadOnlyHOC>
						</>
					)
				}
				body={
					<>
						<p>{t("catalog.get-started.editor")}</p>
						<div
							dangerouslySetInnerHTML={{
								__html: t("catalog.get-started.editor-desc"),
							}}
						/>
						{!hasWorkspace && (
							<p>
								<span>{t("workspace.selected")}</span>
								<code>{PageDataContextService.value.workspace.defaultPath}</code>
								<span>
									&nbsp;
									<a
										href="#"
										onClick={async () => {
											const path = await resolveModule("openDirectory")();
											if (!path) return;
											await FetchService.fetch(apiUrlCreator.setDefaultPath(path));
											await refreshPage();
										}}
									>
										{t("change")}
									</a>
								</span>
							</p>
						)}
					</>
				}
			/>
		</div>
	);
};

const NoneGroups = (props: HTMLAttributes<HTMLDivElement>) => {
	const isReadOnly = PageDataContextService.value.conf.isReadOnly;
	const Component = isReadOnly ? DocportalWelcome : EditorWelcome;

	return (
		<div {...props}>
			<Component />
		</div>
	);
};

export default styled(NoneGroups)`
	margin: auto 0;
	height: inherit;
	width: inherit;
	display: flex;
	align-items: center;
	justify-content: center;
`;
