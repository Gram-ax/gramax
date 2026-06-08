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
import { SingInBrowser } from "@ext/enterprise/components/SingInOut/SingInOut";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogContentPermission } from "@ext/security/logic/Permission/Permissions";
import SwitchWorkspace from "@ext/workspace/components/SwitchWorkspace";
import { HomeLogo } from "../../../../../apps/browser/src/components/Atoms/HomeLogo";

const GesBrowserTopMenu = ({ section }: { section?: Section }) => {
	const hasWorkspace = WorkspaceService.hasActive();
	const canAddCatalog = PermissionService.useCheckAnyCatalogPermission(editCatalogContentPermission);
	const isEnterprise = PageDataContextService.value.conf.activeGesUrl;
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
						{canAddCatalog && <AddCatalogMenu />}
					</TopMenuLeftSideActions>
				)}
			</TopMenuLeftSide>
			<TopMenuRightSide>
				{hasWorkspace && <TopMenuSearch section={section} />}
				<TopMenuSwitchUiLanguageButton />
				<TopMenuThemeToggle />
				{isEnterprise && <SingInBrowser />}
			</TopMenuRightSide>
		</TopMenuWrapper>
	);
};

export default GesBrowserTopMenu;
