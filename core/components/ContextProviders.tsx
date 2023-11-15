import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import CommentCounterService from "@core-ui/ContextServices/CommentCounter";
import IsEditService from "@core-ui/ContextServices/IsEdit";
import IsMacService from "@core-ui/ContextServices/IsMac";
import IsMenuBarOpenService from "@core-ui/ContextServices/IsMenuBarOpenService";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import RefreshPageService from "@core-ui/ContextServices/RefreshPageContext";
import ScrollWebkitService from "@core-ui/ContextServices/ScrollWebkit";
import SearchQueryService from "@core-ui/ContextServices/SearchQuery";
import SidebarsIsPinService from "@core-ui/ContextServices/SidebarsIsPin";
import { useRouter } from "@core/Api/useRouter";
import { ArticleData, HomePageData } from "@core/SitePresenter/SitePresenter";
import ThemeService from "../extensions/Theme/components/ThemeService";
import PageDataContext from "../logic/Context/PageDataContext";
import IsOpenModalService from "../ui-logic/ContextServices/IsOpenMpdal";
import ModalToOpenService from "../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";
import useStartAppFuncs from "../ui-logic/useStartAppFuncs";

export default function ContextProviders({
	pageProps,
	apiHost,
	children,
	refreshPage,
}: {
	pageProps: { data: HomePageData & ArticleData; context: PageDataContext };
	apiHost?: string;
	refreshPage?: () => void;
	children: JSX.Element;
}) {
	const basePath = apiHost ?? useRouter().basePath;
	const isArticlePage = pageProps?.context?.isArticle;

	if (!pageProps || !pageProps.context) return children;

	const apiUrlCreator: ApiUrlCreator = new ApiUrlCreator(
		basePath,
		pageProps.context.lang,
		pageProps.context.theme,
		pageProps.context.isLogged,
		isArticlePage ? pageProps.data.catalogProps.name : null,
		isArticlePage ? pageProps.data.articleProps.ref.path : null,
	);

	return (
		<ApiUrlCreatorService.Provider value={apiUrlCreator}>
			<PageDataContextService.Provider value={pageProps.context}>
				<RefreshPageService.Provider refresh={refreshPage}>
					<ThemeService.Provider value={pageProps.context.theme}>
						<IsMacService.Provider value={pageProps}>
							<SearchQueryService.Provider>
								<IsOpenModalService.Provider>
									<ScrollWebkitService.Provider>
										<SidebarsIsPinService.Provider>
											<>
												{isArticlePage ? (
													<IsMenuBarOpenService.Provider>
														<ModalToOpenService.Provider>
															<ArticleRefService.Provider>
																<ArticlePropsService.Provider
																	value={pageProps.data.articleProps}
																>
																	<CatalogPropsService.Provider
																		value={pageProps.data.catalogProps}
																	>
																		<IsEditService.Provider>
																			<>
																				{pageProps.context.isLogged ? (
																					<CommentCounterService.Provider
																						deps={[pageProps]}
																					>
																						<StartAppFuncs>
																							{children}
																						</StartAppFuncs>
																					</CommentCounterService.Provider>
																				) : (
																					<StartAppFuncs>
																						{children}
																					</StartAppFuncs>
																				)}
																			</>
																		</IsEditService.Provider>
																	</CatalogPropsService.Provider>
																</ArticlePropsService.Provider>
															</ArticleRefService.Provider>
														</ModalToOpenService.Provider>
													</IsMenuBarOpenService.Provider>
												) : (
													<ModalToOpenService.Provider>
														<StartAppFuncs>{children}</StartAppFuncs>
													</ModalToOpenService.Provider>
												)}
											</>
										</SidebarsIsPinService.Provider>
									</ScrollWebkitService.Provider>
								</IsOpenModalService.Provider>
							</SearchQueryService.Provider>
						</IsMacService.Provider>
					</ThemeService.Provider>
				</RefreshPageService.Provider>
			</PageDataContextService.Provider>
		</ApiUrlCreatorService.Provider>
	);
}

const StartAppFuncs = ({ children }: { children: JSX.Element }) => {
	useStartAppFuncs();
	return children;
};
