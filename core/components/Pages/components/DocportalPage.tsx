import { ArticleReadRenderer } from "@components/Article/ArticleReadRenderer";
import ArticleBreadcrumb from "@components/Breadcrumbs/ArticleBreadcrumb";
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
import CatalogComponent from "@components/Layouts/CatalogLayout/CatalogComponent";
import type { PageProps } from "@components/Pages/models/Pages";
import type { HomePageData, Section } from "@core/SitePresenter/SitePresenter";
import type { ReadonlyArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import ArticleViewContainer from "@core-ui/ContextServices/views/articleView/ArticleViewContainer";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import useScrollToArticleAnchor from "@core-ui/hooks/useScrollToArticleAnchor";
import AddCatalogMenu from "@ext/catalog/actions/AddCatalogMenu";
import NewsFeed from "@ext/enterprise/components/NewsFeed";
import { SignInEnterprisePrivate } from "@ext/enterprise/components/SingInOut/SignInEnterprisePrivate";
import { SignInDocportal } from "@ext/enterprise/components/SingInOut/SingInOut";
import { useIsEnterprise } from "@ext/enterprise/utils/useIsEnterprise";
import NextPrevious from "@ext/navigation/NextPrevious";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureWorkspacePermission } from "@ext/security/logic/Permission/Permissions";
import { useSetting } from "@ext/settings/logic/hooks";

const HomeLogo = () => {
	const [theme] = useSetting("general.theme");
	const breakpoint = useBreakpoint();
	const isMobile = breakpoint !== "xl" && breakpoint !== "lg" && breakpoint !== "2xl";

	const apiUrlCreator = ApiUrlCreatorService.value;
	const src = apiUrlCreator.getDocportalHomeLogo(theme, isMobile).toString();

	return <img alt={`logo-${theme}`} className="home-icon h-[2.25rem]" src={src} />;
};

const DocportalTopMenu = ({ section }: { section?: Section }) => {
	const workspacePath = WorkspaceService.current()?.path;
	const gesUrl = useIsEnterprise();
	const isLogged = PageDataContextService.value.isLogged;
	const canAddCatalog = PermissionService.useCheckPermission(configureWorkspacePermission, workspacePath);

	return (
		<TopMenuWrapper>
			<TopMenuLeftSide>
				<HomeLogo />
				{canAddCatalog && (
					<TopMenuLeftSideActions>
						<AddCatalogMenu />
					</TopMenuLeftSideActions>
				)}
			</TopMenuLeftSide>
			<TopMenuRightSide>
				<TopMenuSearch section={section} />
				{!!gesUrl && <NewsFeed />}
				<TopMenuSwitchUiLanguageButton />
				<TopMenuThemeToggle />
				{(!!gesUrl || isLogged) && <SignInDocportal />}
			</TopMenuRightSide>
		</TopMenuWrapper>
	);
};

const HomePage = ({ data }: { data: HomePageData }) => {
	return (
		<HomePageWrapper>
			<DocportalTopMenu />
			<HomePageCatalogListContent data={data} />
			<BottomInfo />
		</HomePageWrapper>
	);
};

const CatalogPage = ({ data }: { data: ReadonlyArticlePageData }) => {
	const gesUrl = PageDataContextService.value.conf.activeGesUrl;
	const isLogged = PageDataContextService.value.isLogged;
	useScrollToArticleAnchor(data);

	if (gesUrl && data.articleProps.errorCode === 403 && !isLogged) {
		return <SignInEnterprisePrivate />;
	}

	return (
		<CatalogComponent data={data}>
			<ArticleViewContainer data={data}>
				<ArticleBreadcrumb hasPreview={false} itemLinks={data.itemLinks} showActions={false} />
				<ArticleReadRenderer data={data} isReadOnly={true} key={data?.articleProps?.ref?.path} />
				<NextPrevious itemLinks={data.itemLinks} />
			</ArticleViewContainer>
		</CatalogComponent>
	);
};

export const DocportalPage = ({ data }: { data: PageProps }) => {
	return data.page === "article" ? (
		<CatalogPage data={data.data as ReadonlyArticlePageData} />
	) : (
		<HomePage data={data.data} />
	);
};
