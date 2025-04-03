import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleDataService from "@core-ui/ContextServices/ArticleData";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import ArticleTooltipService from "@core-ui/ContextServices/ArticleTooltip";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import CommentCounterService from "@core-ui/ContextServices/CommentCounter";
import DiffViewModeService from "@core-ui/ContextServices/DiffViewModeService";
import GitIndexService from "@core-ui/ContextServices/GitIndexService";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import IsMacService from "@core-ui/ContextServices/IsMac";
import IsMenuBarOpenService from "@core-ui/ContextServices/IsMenuBarOpenService";
import IsOfflineService from "@core-ui/ContextServices/IsOfflineService";
import LanguageService from "@core-ui/ContextServices/Language";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import PagePropsUpdateService from "@core-ui/ContextServices/PagePropsUpdate";
import RefreshPageService from "@core-ui/ContextServices/RefreshPageContext";
import SearchQueryService from "@core-ui/ContextServices/SearchQuery";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import SyncIconService from "@core-ui/ContextServices/SyncIconService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import LeftNavViewContentService from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContentService";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import WorkspaceAssetsService from "@core-ui/ContextServices/WorkspaceAssetsService";
import useOnUpdateFuncs from "@core-ui/hooks/onUpdate/useOnUpdateFuncs";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import matomoMetric from "@core-ui/matomoMetric";
import useIsFirstLoad from "@core-ui/useIsFirstLoad";
import yandexMetric from "@core-ui/yandexMetric";
import { useRouter } from "@core/Api/useRouter";
import { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import EditorExtensionsService from "@ext/markdown/elements/diff/components/EditorExtensionsService";
import CurrentTabsTagService from "@ext/markdown/elements/tabs/components/CurrentTabsTagService";
import PropertyService from "@ext/properties/components/PropertyService";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import ThemeService from "../extensions/Theme/components/ThemeService";
import PageDataContext from "../logic/Context/PageDataContext";
import IsOpenModalService from "../ui-logic/ContextServices/IsOpenMpdal";
import ModalToOpenService from "../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import InboxService from "@ext/inbox/components/InboxService";

export interface PageProps {
	data: HomePageData & ArticlePageData;
	context: PageDataContext;
}

export default function ContextProviders({
	pageProps,
	apiHost,
	children,
	clearData,
	refreshPage,
}: {
	pageProps: PageProps;
	apiHost?: string;
	refreshPage?: () => Promise<void> | void;
	clearData?: () => void;
	children: JSX.Element;
}) {
	const basePath = apiHost ?? useRouter().basePath;
	const isArticlePage = pageProps?.context?.isArticle;
	const [isFirstLoad, resetIsFirstLoad] = useIsFirstLoad();

	if (!pageProps || !pageProps.context) return children;

	const apiUrlCreator = new ApiUrlCreator(
		basePath,
		isArticlePage ? pageProps.data.catalogProps.name : null,
		isArticlePage ? pageProps.data.articleProps.ref.path : null,
	);

	if (isArticlePage && !pageProps.context.language.content)
		pageProps.context.language.content = pageProps.data.catalogProps.language;

	const { isNext } = usePlatform();
	const isProduction = pageProps.context.conf.isProduction;
	const metrics = pageProps.context.conf.metrics;
	if (isNext && isProduction) matomoMetric(metrics.matomo);
	if (isNext && isProduction) yandexMetric(metrics.yandex.metricCounter);

	return (
		<PagePropsUpdateService.Provider pageData={pageProps}>
			<IsOfflineService.Provider>
				<PermissionService.Provider value={pageProps.context.permissions}>
					<ApiUrlCreatorService.Provider value={apiUrlCreator}>
						<LanguageService.Provider language={pageProps.context.language?.ui}>
							<PageDataContextService.Provider value={pageProps.context}>
								<RefreshPageService.Provider refresh={refreshPage} clearData={clearData}>
									<ThemeService.Provider value={pageProps.context.theme}>
										<IsMacService.Provider>
											<WorkspaceService.Provider
												current={pageProps.context.workspace.current}
												workspaces={pageProps.context.workspace.workspaces}
											>
												<WorkspaceAssetsService.Provider>
													<SearchQueryService.Provider>
														<SyncIconService.Provider>
															<IsOpenModalService.Provider>
																<SidebarsIsPinService.Provider>
																	<>
																		{isArticlePage ? (
																			<DiffViewModeService.Provider>
																				<GitIndexService.Provider>
																					<EditorExtensionsService.Provider>
																						<OnLoadResourceService.Provider>
																							<IsMenuBarOpenService.Provider>
																								<ArticleRefService.Provider>
																									<ArticleDataService.Provider
																										value={
																											pageProps.data
																										}
																									>
																										<ArticlePropsService.Provider
																											value={
																												pageProps
																													.data
																													.articleProps
																											}
																										>
																											<CatalogPropsService.Provider
																												value={
																													pageProps
																														.data
																														.catalogProps
																												}
																											>
																												<InboxService.Provider>
																													<PropertyService.Provider>
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
																													</PropertyService.Provider>
																												</InboxService.Provider>
																											</CatalogPropsService.Provider>
																										</ArticlePropsService.Provider>
																									</ArticleDataService.Provider>
																								</ArticleRefService.Provider>
																							</IsMenuBarOpenService.Provider>
																						</OnLoadResourceService.Provider>
																					</EditorExtensionsService.Provider>
																				</GitIndexService.Provider>
																			</DiffViewModeService.Provider>
																		) : (
																			<ModalToOpenService.Provider>
																				<IsFirstLoadService.Provider
																					resetIsFirstLoad={resetIsFirstLoad}
																					value={isFirstLoad}
																				>
																					<OnUpdateAppFuncs>
																						{children}
																					</OnUpdateAppFuncs>
																				</IsFirstLoadService.Provider>
																			</ModalToOpenService.Provider>
																		)}
																	</>
																</SidebarsIsPinService.Provider>
															</IsOpenModalService.Provider>
														</SyncIconService.Provider>
													</SearchQueryService.Provider>
												</WorkspaceAssetsService.Provider>
											</WorkspaceService.Provider>
										</IsMacService.Provider>
									</ThemeService.Provider>
								</RefreshPageService.Provider>
							</PageDataContextService.Provider>
						</LanguageService.Provider>
					</ApiUrlCreatorService.Provider>
				</PermissionService.Provider>
			</IsOfflineService.Provider>
		</PagePropsUpdateService.Provider>
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
