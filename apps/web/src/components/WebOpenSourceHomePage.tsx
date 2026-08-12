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
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { GlobalAudioToolbar } from "@ext/ai/components/Audio/Toolbar";
import AddCatalogMenu from "@ext/catalog/actions/AddCatalogMenu";
import UserMenu from "@ext/settings/components/UserMenu";
import SwitchWorkspace from "@ext/workspace/components/SwitchWorkspace";
import { HomeLogo } from "./Atoms/HomeLogo";

const WebOpenSourceTopMenu = ({ section }: { section?: Section }) => {
	const hasWorkspace = WorkspaceService.hasActive();
	return (
		<TopMenuWrapper>
			<TopMenuLeftSide>
				<HomeLogo />
				{hasWorkspace && (
					<TopMenuLeftSideActions>
						<SwitchWorkspace />
						<AddCatalogMenu />
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

const WebOpenSourceHomePage = ({ data }: { data: HomePageData }) => {
	return (
		<HomePageWrapper>
			<WebOpenSourceTopMenu section={data.section} />
			<HomePageCatalogListContent data={data} />
			<BottomInfo />
			<GlobalAudioToolbar />
		</HomePageWrapper>
	);
};

export default WebOpenSourceHomePage;
