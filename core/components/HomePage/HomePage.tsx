import type { Environment } from "@app/resolveModule/env";
import BottomInfo from "@components/HomePage/BottomInfo";
import { HomePageCatalogListContent } from "@components/HomePage/Components/HomePageCatalogListContent";
import { HomePageWrapper } from "@components/HomePage/Components/HomePageWrapper";
import TopMenuSearch from "@components/HomePage/TopMenu/Components/TopMenuSearch";
import TopMenuSwitchUiLanguageButton from "@components/HomePage/TopMenu/Components/TopMenuSwitchUiLanguageButton";
import TopMenuThemeToggle from "@components/HomePage/TopMenu/Components/TopMenuThemeToggle";
import TopMenuWrapper, {
	TopMenuLeftSide,
	TopMenuLeftSideActions,
	TopMenuRightSide,
} from "@components/HomePage/TopMenu/Components/TopMenuWrapper";
import type { HomePageData, Section } from "@core/SitePresenter/SitePresenter";
import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { GlobalAudioToolbar } from "@ext/ai/components/Audio/Toolbar";
import AddCatalogMenu from "@ext/catalog/actions/AddCatalogMenu";
import { useIsEnterprise } from "@ext/enterprise/utils/useIsEnterprise";
import { GesCloudEditorHomePage } from "@ext/enterprise-cloud/components/HomePage/GesCloudEditorHomePage";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogPermission, readPermission } from "@ext/security/logic/Permission/Permissions";
import UserMenu from "@ext/settings/components/UserMenu";
import { feature } from "@ext/toggleFeatures/features";
import SwitchWorkspace from "@ext/workspace/components/SwitchWorkspace";
import type React from "react";
import { HomeLogo } from "../../../apps/web/src/components/Atoms/HomeLogo";
import WebHomePage from "../../../apps/web/src/components/WebHomePage";

const StaticTopMenu = () => {
	return (
		<TopMenuWrapper>
			<TopMenuLeftSide>
				<HomeLogo />
			</TopMenuLeftSide>
			<TopMenuRightSide>
				<TopMenuSwitchUiLanguageButton />
				<TopMenuThemeToggle />
				<UserMenu />
			</TopMenuRightSide>
		</TopMenuWrapper>
	);
};

const TauriTopMenu = ({ section }: { section?: Section }) => {
	const isMac = IsMacService.value;
	const hasEditCatalogPermission = PermissionService.useCheckPermission(
		editCatalogPermission,
		WorkspaceService.current().path,
	);
	const hasReadCatalogContentPermission = PermissionService.useCheckAnyCatalogPermission(readPermission);
	const shouldCheckCatalogPermissions = useIsEnterprise();
	const canEditCatalogContent = !shouldCheckCatalogPermissions || hasEditCatalogPermission;
	const canCloneCatalog = !shouldCheckCatalogPermissions || hasReadCatalogContentPermission;
	const hasWorkspace = WorkspaceService.hasActive();

	return (
		<TopMenuWrapper className={isMac ? "pt-4" : ""}>
			<TopMenuLeftSide>
				<HomeLogo />
				<TopMenuLeftSideActions>
					{hasWorkspace && <SwitchWorkspace />}
					{(canEditCatalogContent || canCloneCatalog) && (
						<AddCatalogMenu
							canCloneCatalog={canCloneCatalog}
							canCreateCatalog={canEditCatalogContent}
							canImportCatalog={canEditCatalogContent}
						/>
					)}
				</TopMenuLeftSideActions>
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

const components: Record<Environment, ({ data }: { data: HomePageData }) => React.ReactNode> = {
	tauri: ({ data }) => <TauriHomePage data={data} />,
	static: ({ data }) => <StaticHomePage data={data} />,
	web: ({ data }) => <WebHomePage data={data} />,
	cli: () => null,
	next: () => null,
	test: () => null,
	docportal: () => null,
};

const HomePage = ({ data }: { data: HomePageData }) => {
	const { environment } = usePlatform();
	return components[environment]({ data });
};

const StaticHomePage = ({ data }: { data: HomePageData }) => {
	return (
		<HomePageWrapper>
			<StaticTopMenu />
			<HomePageCatalogListContent data={data} />
			<BottomInfo />
			<GlobalAudioToolbar />
		</HomePageWrapper>
	);
};

const TauriHomePage = ({ data }: { data: HomePageData }) => {
	const { url: gesCloudUrl, enabled } = PageDataContextService.value.conf.enterpriseCloud;
	const isLogged = PageDataContextService.value.isLogged;
	const gesCloudMode = feature("ges-cloud") && gesCloudUrl && enabled && isLogged;

	if (gesCloudMode) return <GesCloudEditorHomePage data={data} />;

	return (
		<HomePageWrapper>
			<TauriTopMenu section={data.section} />
			<HomePageCatalogListContent data={data} />
			<BottomInfo />
			<GlobalAudioToolbar />
		</HomePageWrapper>
	);
};

export default HomePage;
