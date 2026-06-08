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
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { GlobalAudioToolbar } from "@ext/ai/components/Audio/Toolbar";
import AddCatalogMenu from "@ext/catalog/actions/AddCatalogMenu";
import { SingInTauri } from "@ext/enterprise/components/SingInOut/SingInOut";
import SwitchUiLanguage from "@ext/localization/actions/SwitchUiLanguage";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { editCatalogContentPermission } from "@ext/security/logic/Permission/Permissions";
import ThemeToggle from "@ext/Theme/components/ThemeToggle";
import SwitchWorkspace from "@ext/workspace/components/SwitchWorkspace";
import type React from "react";
import { HomeLogo } from "../../../apps/browser/src/components/Atoms/HomeLogo";
import BrowserHomePage from "../../../apps/browser/src/components/BrowserHomePage";

const StaticTopMenu = () => {
	return (
		<TopMenuWrapper>
			<TopMenuLeftSide>
				<HomeLogo />
			</TopMenuLeftSide>
			<TopMenuRightSide>
				<SwitchUiLanguage size="lg" />
				<ThemeToggle isHomePage />
			</TopMenuRightSide>
		</TopMenuWrapper>
	);
};

const TauriTopMenu = ({ section }: { section?: Section }) => {
	const isMac = IsMacService.value;
	const canAddCatalog = PermissionService.useCheckAnyCatalogPermission(editCatalogContentPermission);
	const hasWorkspace = WorkspaceService.hasActive();

	return (
		<TopMenuWrapper className={isMac ? "pt-4" : ""}>
			<TopMenuLeftSide>
				<HomeLogo />
				<TopMenuLeftSideActions>
					{hasWorkspace && <SwitchWorkspace />}
					{canAddCatalog && <AddCatalogMenu />}
				</TopMenuLeftSideActions>
			</TopMenuLeftSide>
			<TopMenuRightSide>
				{hasWorkspace && <TopMenuSearch section={section} />}
				<TopMenuSwitchUiLanguageButton />
				<TopMenuThemeToggle />
				<SingInTauri />
			</TopMenuRightSide>
		</TopMenuWrapper>
	);
};

const components: Record<Environment, ({ data }: { data: HomePageData }) => React.ReactNode> = {
	tauri: ({ data }) => <TauriHomePage data={data} />,
	static: ({ data }) => <StaticHomePage data={data} />,
	browser: ({ data }) => <BrowserHomePage data={data} />,
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
