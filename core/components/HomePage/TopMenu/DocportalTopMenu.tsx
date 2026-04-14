import { TopMenuLeftSideWithLogo } from "@components/HomePage/TopMenu/Components/TopMenuLeftSideWithLogo";
import { TopMenuRightSide } from "@components/HomePage/TopMenu/Components/TopMenuRightSide";
import { TopMenuWrapper } from "@components/HomePage/TopMenu/Components/TopMenuWrapper";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import AddCatalogMenu from "@ext/catalog/actions/AddCatalogMenu";
import NewsFeed from "@ext/enterprise/components/NewsFeed";
import { SignInDocportal } from "@ext/enterprise/components/SingInOut/SingInOut";
import SwitchUiLanguage from "@ext/localization/actions/SwitchUiLanguage";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureWorkspacePermission } from "@ext/security/logic/Permission/Permissions";
import Search from "@ext/serach/components/Search";
import ThemeToggle from "@ext/Theme/components/ThemeToggle";

export const DocportalTopMenu = () => {
	const workspacePath = WorkspaceService.current()?.path;
	const gesUrl = PageDataContextService.value.conf.enterprise.gesUrl;
	const canAddCatalog = PermissionService.useCheckPermission(configureWorkspacePermission, workspacePath);

	return (
		<TopMenuWrapper>
			<TopMenuLeftSideWithLogo>{canAddCatalog && <AddCatalogMenu />}</TopMenuLeftSideWithLogo>
			<TopMenuRightSide>
				<Search isHomePage />
				{!!gesUrl && <NewsFeed />}
				<SwitchUiLanguage size="lg" />
				<ThemeToggle isHomePage />
				{!!gesUrl && <SignInDocportal />}
			</TopMenuRightSide>
		</TopMenuWrapper>
	);
};
