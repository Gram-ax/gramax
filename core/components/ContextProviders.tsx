import { Environment } from "@app/resolveModule/env";
import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleDataService from "@core-ui/ContextServices/ArticleData";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import ArticleTooltipService from "@core-ui/ContextServices/ArticleTooltip";
import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import CommentCounterService from "@core-ui/ContextServices/CommentCounter";
import ContextService from "@core-ui/ContextServices/ContextService";
import DiffViewModeService from "@core-ui/ContextServices/DiffViewModeService";
import GitIndexService from "@core-ui/ContextServices/GitIndexService";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import IsMacService from "@core-ui/ContextServices/IsMac";
import IsMenuBarOpenService from "@core-ui/ContextServices/IsMenuBarOpenService";
import isOfflineService from "@core-ui/ContextServices/IsOfflineService";
import LanguageService from "@core-ui/ContextServices/Language";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import pagePropsUpdateService from "@core-ui/ContextServices/PagePropsUpdate";
import PlatformService from "@core-ui/ContextServices/PlatformService";
import SearchQueryService from "@core-ui/ContextServices/SearchQuery";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import GlobalSyncCountService from "@core-ui/ContextServices/SyncCount/GlobalSyncCount";
import SyncIconService from "@core-ui/ContextServices/SyncIconService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import LeftNavViewContentService from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContentService";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import WorkspaceAssetsService from "@core-ui/ContextServices/WorkspaceAssetsService";
import useOnUpdateFuncs from "@core-ui/hooks/onUpdate/useOnUpdateFuncs";
import matomoMetric from "@core-ui/matomoMetric";
import useIsFirstLoad from "@core-ui/useIsFirstLoad";
import { initRefresh } from "@core-ui/utils/initGlobalFuncs";
import yandexMetric from "@core-ui/yandexMetric";
import { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import PromptService from "@ext/ai/components/Tab/PromptService";
import FavoriteService from "@ext/artilce/Favorite/components/FavoriteService";
import PublishChangesProvider from "@ext/git/core/GitPublish/PublishChangesProvider";
import InboxService from "@ext/inbox/components/InboxService";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import EditorExtensionsService from "@ext/markdown/elements/diff/components/EditorExtensionsService";
import SnippetService from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetService";
import CurrentTabsTagService from "@ext/markdown/elements/tabs/components/CurrentTabsTagService";
import PropertyService from "@ext/properties/components/PropertyService";
import permissionService from "@ext/security/logic/Permission/components/PermissionService";
import TemplateService from "@ext/templates/components/TemplateService";
import ThemeService from "../extensions/Theme/components/ThemeService";
import PageDataContext from "../logic/Context/PageDataContext";
import IsOpenModalService from "../ui-logic/ContextServices/IsOpenMpdal";
import ModalToOpenService from "../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";

export interface PageProps {
	data: HomePageData & ArticlePageData;
	context: PageDataContext;
}

const appServices: ContextService[] = [
	pagePropsUpdateService,
	isOfflineService,
	permissionService,
	ApiUrlCreatorService,
	LanguageService,
	PageDataContextService,
	IsMacService,
	WorkspaceService,
	WorkspaceAssetsService,
	SearchQueryService,
	FavoriteService,
	SyncIconService,
	IsOpenModalService,
	PublishChangesProvider,
	GlobalSyncCountService,
];
const Inits = appServices.map((service) => service.Init.bind(service) as typeof service.Init);
const NavigationTabInit = NavigationTabsService.Init.bind(NavigationTabsService);

export default function ContextProviders({
	pageProps,
	children,
	clearData,
	refreshPage,
	platform,
}: {
	pageProps: PageProps;
	refreshPage?: () => Promise<void> | void;
	clearData?: () => void;
	children: JSX.Element;
	platform: Environment;
}) {
	const isArticlePage = pageProps?.context?.isArticle;
	const [isFirstLoad, resetIsFirstLoad] = useIsFirstLoad();

	if (!pageProps || !pageProps.context) return children;

	if (isArticlePage && !pageProps.context.language.content)
		pageProps.context.language.content = pageProps.data.catalogProps.language;

	const isProduction = pageProps.context.conf.isProduction;
	const metrics = pageProps.context.conf.metrics;
	if (platform === "next" && isProduction) matomoMetric(metrics.matomo);
	if (platform === "next" && isProduction) yandexMetric(metrics.yandex.metricCounter);

	initRefresh(refreshPage, clearData);
	return (
		<PlatformService.Provider value={platform}>
			<ThemeService.Provider value={pageProps.context.theme}>
				{Inits.reduceRight(
					(children, Provider) => {
						return <Provider pageProps={pageProps}>{children}</Provider>;
					},
					<SidebarsIsPinService.Provider>
						<>
							{isArticlePage ? (
								<NavigationTabInit>
									<DiffViewModeService.Provider>
										<GitIndexService.Provider>
											<EditorExtensionsService.Provider>
												<ResourceService.Provider>
													<IsMenuBarOpenService.Provider>
														<ArticleRefService.Provider>
															<ArticleDataService.Provider value={pageProps.data}>
																<ArticlePropsService.Provider
																	value={pageProps.data.articleProps}
																>
																	<CatalogPropsService.Init
																		value={pageProps.data.catalogProps}
																	>
																		<CatalogLogoService.Init>
																			<PromptService.Provider>
																				<InboxService.Provider>
																					<PropertyService.Provider>
																						<TemplateService.Init>
																							<SnippetService.Init>
																								<ModalToOpenService.Provider>
																									<CurrentTabsTagService.Provider>
																										<ArticleTooltipService.Provider>
																											<IsFirstLoadService.Provider
																												resetIsFirstLoad={
																													resetIsFirstLoad
																												}
																												value={
																													isFirstLoad
																												}
																											>
																												<OnUpdateAppFuncs>
																													<ViewContextProvider
																														articlePageData={
																															pageProps.data
																														}
																													>
																														<>
																															{pageProps
																																.context
																																.isLogged ? (
																																<CommentCounterService.Provider
																																	deps={[
																																		pageProps,
																																	]}
																																>
																																	{
																																		children
																																	}
																																</CommentCounterService.Provider>
																															) : (
																																children
																															)}
																														</>
																													</ViewContextProvider>
																												</OnUpdateAppFuncs>
																											</IsFirstLoadService.Provider>
																										</ArticleTooltipService.Provider>
																									</CurrentTabsTagService.Provider>
																								</ModalToOpenService.Provider>
																							</SnippetService.Init>
																						</TemplateService.Init>
																					</PropertyService.Provider>
																				</InboxService.Provider>
																			</PromptService.Provider>
																		</CatalogLogoService.Init>
																	</CatalogPropsService.Init>
																</ArticlePropsService.Provider>
															</ArticleDataService.Provider>
														</ArticleRefService.Provider>
													</IsMenuBarOpenService.Provider>
												</ResourceService.Provider>
											</EditorExtensionsService.Provider>
										</GitIndexService.Provider>
									</DiffViewModeService.Provider>
								</NavigationTabInit>
							) : (
								<ModalToOpenService.Provider>
									<IsFirstLoadService.Provider
										resetIsFirstLoad={resetIsFirstLoad}
										value={isFirstLoad}
									>
										<OnUpdateAppFuncs>{children}</OnUpdateAppFuncs>
									</IsFirstLoadService.Provider>
								</ModalToOpenService.Provider>
							)}
						</>
					</SidebarsIsPinService.Provider>,
				)}
			</ThemeService.Provider>
		</PlatformService.Provider>
	);
}

const OnUpdateAppFuncs = ({ children }: { children: JSX.Element }) => {
	useOnUpdateFuncs();
	return children;
};

interface ViewContextProviderProps {
	articlePageData: ArticlePageData;
	children: JSX.Element;
}

const ViewContextProvider = ({ articlePageData, children }: ViewContextProviderProps) => {
	return (
		<ArticleViewService.Provider articlePageData={articlePageData}>
			<LeftNavViewContentService.Provider>{children}</LeftNavViewContentService.Provider>
		</ArticleViewService.Provider>
	);
};
