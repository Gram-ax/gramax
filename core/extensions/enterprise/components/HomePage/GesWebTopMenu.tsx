import TopMenuSearch from "@components/HomePage/TopMenu/Components/TopMenuSearch";
import TopMenuSwitchUiLanguageButton from "@components/HomePage/TopMenu/Components/TopMenuSwitchUiLanguageButton";
import TopMenuThemeToggle from "@components/HomePage/TopMenu/Components/TopMenuThemeToggle";
import TopMenuWrapper, {
	TopMenuLeftSide,
	TopMenuLeftSideActions,
	TopMenuRightSide,
} from "@components/HomePage/TopMenu/Components/TopMenuWrapper";
import type { Section } from "@core/SitePresenter/SitePresenter";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import AddCatalogMenu from "@ext/catalog/actions/AddCatalogMenu";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogPermission, readPermission } from "@ext/security/logic/Permission/Permissions";
import UserMenu from "@ext/settings/components/UserMenu";
import SwitchWorkspace from "@ext/workspace/components/SwitchWorkspace";
import { HomeLogo } from "../../../../../apps/web/src/components/Atoms/HomeLogo";

const GesWebTopMenu = ({ section }: { section?: Section }) => {
	const hasWorkspace = WorkspaceService.hasActive();
	const hasEditCatalogPermission = PermissionService.useCheckPermission(
		editCatalogPermission,
		WorkspaceService.current().path,
	);
	const hasReadCatalogContentPermission = PermissionService.useCheckAnyCatalogPermission(readPermission);
	const isEnterprise = PageDataContextService.value.conf.activeGesUrl;
	const canEditCatalogContent = !isEnterprise || hasEditCatalogPermission;
	const canCloneCatalog = !isEnterprise || hasReadCatalogContentPermission;
	const isLogged = PageDataContextService.value.isLogged;

	let isWorkWithCatalogAllowed = hasWorkspace;
	if (isEnterprise && !isLogged) isWorkWithCatalogAllowed = false;

	return (
		<TopMenuWrapper>
			<TopMenuLeftSide>
				<HomeLogo />
				{isWorkWithCatalogAllowed && (
					<TopMenuLeftSideActions>
						<SwitchWorkspace />
						{(canEditCatalogContent || canCloneCatalog) && (
							<AddCatalogMenu
								canCloneCatalog={canCloneCatalog}
								canCreateCatalog={canEditCatalogContent}
								canImportCatalog={canEditCatalogContent}
							/>
						)}
					</TopMenuLeftSideActions>
				)}
			</TopMenuLeftSide>
			<TopMenuRightSide>
				{hasWorkspace && <TopMenuSearch section={section} />}
				<TopMenuSwitchUiLanguageButton />
				<TopMenuThemeToggle />
				<UserMenu />
			</TopMenuRightSide>
		</TopMenuWrapper>
	);
};

export default GesWebTopMenu;
