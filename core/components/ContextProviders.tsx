import { Environment } from "@app/resolveModule/env";
import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import ArticleTooltipService from "@core-ui/ContextServices/ArticleTooltip";
import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import CloudStateService from "@core-ui/ContextServices/CloudState";
import ContextService from "@core-ui/ContextServices/ContextService";
import GitIndexService from "@core-ui/ContextServices/GitIndexService";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import IsMacService from "@core-ui/ContextServices/IsMac";
import isOfflineService from "@core-ui/ContextServices/IsOfflineService";
import LanguageService from "@core-ui/ContextServices/Language";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import pagePropsUpdateService from "@core-ui/ContextServices/PagePropsUpdate";
import PlatformService from "@core-ui/ContextServices/PlatformService";
import SearchQueryService from "@core-ui/ContextServices/SearchQuery";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import GlobalSyncCountService from "@core-ui/ContextServices/SyncCount/GlobalSyncCount";
import SyncableWorkspacesService from "@core-ui/ContextServices/SyncCount/SyncableWorkspaces";
import SyncIconService from "@core-ui/ContextServices/SyncIconService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import LeftNavViewContentService from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContentService";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import WorkspaceAssetsService from "@core-ui/ContextServices/WorkspaceAssetsService";
import useOnUpdateFuncs from "@core-ui/hooks/onUpdate/useOnUpdateFuncs";
import matomoMetric from "@core-ui/matomoMetric";
import { CatalogStoreProvider } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import useIsFirstLoad from "@core-ui/useIsFirstLoad";
import { initRefresh } from "@core-ui/utils/initGlobalFuncs";
import yandexMetric from "@core-ui/yandexMetric";
import { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import AudioRecorderService from "@ext/ai/components/Audio/AudioRecorderService";
import PromptService from "@ext/ai/components/Tab/PromptService";
import FavoriteService from "@ext/article/Favorite/components/FavoriteService";
import PublishChangesProvider from "@ext/git/core/GitPublish/PublishChangesProvider";
import InboxService from "@ext/inbox/components/InboxService";
import UiLanguage from "@ext/localization/core/model/Language";
import { CommentsCounterProvider } from "@ext/markdown/elements/comment/edit/logic/CommentsCounterStore";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { QuestionsProvider } from "@ext/markdown/elements/question/render/logic/QuestionsProvider";
import SnippetService from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetService";
import PropertyService from "@ext/properties/components/PropertyService";
import permissionService from "@ext/security/logic/Permission/components/PermissionService";
import TemplateService from "@ext/templates/components/TemplateService";
import { TooltipProvider } from "@ui-kit/Tooltip";
import ThemeService from "../extensions/Theme/components/ThemeService";
import PageDataContext from "../logic/Context/PageDataContext";
import IsMobileService from "../ui-logic/ContextServices/isMobileService";
import IsOpenModalService from "../ui-logic/ContextServices/IsOpenMpdal";
import ModalToOpenService from "../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";

export interface PageProps {
	data: HomePageData & ArticlePageData;
	context: PageDataContext;
}

const appServices: ContextService[] = [
	pagePropsUpdateService,
	isOfflineService,
	IsMobileService,
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
	SourceDataService,
	IsOpenModalService,
	PublishChangesProvider,
	AudioRecorderService,
	SyncableWorkspacesService,
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
	if (pageProps.context.conf.forceUiLangSync) {
		const uiLanguageByContentLanguage = UiLanguage[pageProps.context.language.content];
		if (uiLanguageByContentLanguage) pageProps.context.language.ui = uiLanguageByContentLanguage;
	}

	const isProduction = pageProps.context.conf.isProduction;
	const metrics = pageProps.context.conf.metrics;
	if (platform === "next" && isProduction) matomoMetric(metrics.matomo);
	if (platform === "next" && isProduction) yandexMetric(metrics.yandex.metricCounter);

	initRefresh(refreshPage, clearData);
	return (
		<PlatformService.Provider value={platform}>
			<ThemeService.Provider value={pageProps.context.theme}>
				<TooltipProvider>
					{Inits.reduceRight(
						(children, Provider) => {
							return <Provider pageProps={pageProps}>{children}</Provider>;
						},
						<SidebarsIsPinService.Provider>
							<>
								{isArticlePage ? (
									<NavigationTabInit>
										<GitIndexService.Provider>
											<CatalogStoreProvider data={pageProps.data.catalogProps}>
												<QuestionsProvider
													path={pageProps.data.articleProps.ref.path}
													questions={pageProps.data.articleProps.questions}
												>
													<ResourceService.Provider>
														<ArticleRefService.Provider>
															<ArticlePropsService.Provider
																value={pageProps.data.articleProps}
															>
																<CloudStateService.Init
																	value={{
																		cloudServiceUrl:
																			pageProps.context.conf.cloudServiceUrl,
																		catalogName: pageProps.data.catalogProps.name,
																	}}
																>
																	<CatalogLogoService.Init>
																		<PromptService.Provider>
																			<InboxService.Provider>
																				<PropertyService.Provider>
																					<TemplateService.Init>
																						<SnippetService.Init>
																							<ModalToOpenService.Provider>
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
																											<ViewContextProvider>
																												{pageProps
																													.context
																													.isLogged ? (
																													<CommentsCounterProvider
																														deps={[
																															pageProps,
																														]}
																													>
																														{
																															children
																														}
																													</CommentsCounterProvider>
																												) : (
																													children
																												)}
																											</ViewContextProvider>
																										</OnUpdateAppFuncs>
																									</IsFirstLoadService.Provider>
																								</ArticleTooltipService.Provider>
																							</ModalToOpenService.Provider>
																						</SnippetService.Init>
																					</TemplateService.Init>
																				</PropertyService.Provider>
																			</InboxService.Provider>
																		</PromptService.Provider>
																	</CatalogLogoService.Init>
																</CloudStateService.Init>
															</ArticlePropsService.Provider>
														</ArticleRefService.Provider>
													</ResourceService.Provider>
												</QuestionsProvider>
											</CatalogStoreProvider>
										</GitIndexService.Provider>
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
				</TooltipProvider>
			</ThemeService.Provider>
		</PlatformService.Provider>
	);
}

const OnUpdateAppFuncs = ({ children }: { children: JSX.Element }) => {
	useOnUpdateFuncs();
	return children;
};

interface ViewContextProviderProps {
	children: JSX.Element;
}

const ViewContextProvider = ({ children }: ViewContextProviderProps) => {
	return (
		<ArticleViewService.Provider>
			<LeftNavViewContentService.Provider>{children}</LeftNavViewContentService.Provider>
		</ArticleViewService.Provider>
	);
};
