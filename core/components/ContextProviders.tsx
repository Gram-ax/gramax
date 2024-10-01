import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import ArticleTooltipService from "@core-ui/ContextServices/ArticleTooltip";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import CommentCounterService from "@core-ui/ContextServices/CommentCounter";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import IsMacService from "@core-ui/ContextServices/IsMac";
import IsMenuBarOpenService from "@core-ui/ContextServices/IsMenuBarOpenService";
import IsOfflineService from "@core-ui/ContextServices/IsOfflineService";
import LanguageService from "@core-ui/ContextServices/Language";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import RefreshPageService from "@core-ui/ContextServices/RefreshPageContext";
import ScrollWebkitService from "@core-ui/ContextServices/ScrollWebkit";
import SearchQueryService from "@core-ui/ContextServices/SearchQuery";
import SidebarsIsPinService from "@core-ui/ContextServices/SidebarsIsPin";
import SyncIconService from "@core-ui/ContextServices/SyncIconService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import LeftNavViewContentService from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContentService";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import useIsFirstLoad from "@core-ui/useIsFirstLoad";
import yandexMetric from "@core-ui/yandexMetric";
import { useRouter } from "@core/Api/useRouter";
import { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import CurrentTabsTagService from "@ext/markdown/elements/tabs/components/CurrentTabsTagService";
import ThemeService from "../extensions/Theme/components/ThemeService";
import PageDataContext from "../logic/Context/PageDataContext";
import IsOpenModalService from "../ui-logic/ContextServices/IsOpenMpdal";
import ModalToOpenService from "../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import useOnUpdateFuncs from "../ui-logic/useOnUpdateFuncs";

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
	const isFirstLoad = useIsFirstLoad();

	if (!pageProps || !pageProps.context) return children;

	const apiUrlCreator = new ApiUrlCreator(
		basePath,
		pageProps.context.isLogged,
		isArticlePage ? pageProps.data.catalogProps.name : null,
		isArticlePage ? pageProps.data.articleProps.ref.path : null,
	);

	if (isArticlePage && !pageProps.context.language.content)
		pageProps.context.language.content = pageProps.data.catalogProps.language;

	const isServerApp = pageProps.context.conf.isServerApp;
	const isProduction = pageProps.context.conf.isProduction;
	const yandexMetricCounter = pageProps.context.conf.yandexMetricCounter;
	if (isServerApp && isProduction) yandexMetric(yandexMetricCounter);

	return (
		<IsOfflineService.Provider>
			<LanguageService.Provider>
				<ApiUrlCreatorService.Provider value={apiUrlCreator}>
					<PageDataContextService.Provider value={pageProps.context}>
						<RefreshPageService.Provider refresh={refreshPage} clearData={clearData}>
							<ThemeService.Provider value={pageProps.context.theme}>
								<IsMacService.Provider>
									<WorkspaceService.Provider>
										<SearchQueryService.Provider>
											<SyncIconService.Provider>
												<IsOpenModalService.Provider>
													<ScrollWebkitService.Provider>
														<SidebarsIsPinService.Provider>
															<>
																{isArticlePage ? (
																	<OnLoadResourceService.Provider>
																		<IsMenuBarOpenService.Provider>
																			<ArticleRefService.Provider>
																				<ArticlePropsService.Provider
																					value={pageProps.data.articleProps}
																				>
																					<CatalogPropsService.Provider
																						value={
																							pageProps.data.catalogProps
																						}
																					>
																						<ModalToOpenService.Provider>
																							<CurrentTabsTagService.Provider>
																								<IsEditService.Provider>
																									<ArticleTooltipService.Provider>
																										<IsFirstLoadService.Provider
																											value={
																												isFirstLoad
																											}
																										>
																											<ViewContextProvider
																												articlePageData={
																													pageProps.data
																												}
																											>
																												<OnUpdateAppFuncs>
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
																												</OnUpdateAppFuncs>
																											</ViewContextProvider>
																										</IsFirstLoadService.Provider>
																									</ArticleTooltipService.Provider>
																								</IsEditService.Provider>
																							</CurrentTabsTagService.Provider>
																						</ModalToOpenService.Provider>
																					</CatalogPropsService.Provider>
																				</ArticlePropsService.Provider>
																			</ArticleRefService.Provider>
																		</IsMenuBarOpenService.Provider>
																	</OnLoadResourceService.Provider>
																) : (
																	<ModalToOpenService.Provider>
																		<IsFirstLoadService.Provider
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
													</ScrollWebkitService.Provider>
												</IsOpenModalService.Provider>
											</SyncIconService.Provider>
										</SearchQueryService.Provider>
									</WorkspaceService.Provider>
								</IsMacService.Provider>
							</ThemeService.Provider>
						</RefreshPageService.Provider>
					</PageDataContextService.Provider>
				</ApiUrlCreatorService.Provider>
			</LanguageService.Provider>
		</IsOfflineService.Provider>
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
