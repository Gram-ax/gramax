import type { Environment } from "@app/resolveModule/env";
import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import type { PageProps } from "@components/Pages/models/Pages";
import { useRouter } from "@core/Api/useRouter";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import ArticleTooltipService from "@core-ui/ContextServices/ArticleTooltip";
import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import CloudStateService from "@core-ui/ContextServices/CloudState";
import type ContextService from "@core-ui/ContextServices/ContextService";
import GitIndexService from "@core-ui/ContextServices/GitIndexService";
import IsFirstLoadService from "@core-ui/ContextServices/IsFirstLoadService";
import IsMacService from "@core-ui/ContextServices/IsMac";
import { useMigrateLegacyUiLang } from "@core-ui/ContextServices/Language";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import pagePropsUpdateService from "@core-ui/ContextServices/PagePropsUpdate";
import PlatformService from "@core-ui/ContextServices/PlatformService";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import SearchQueryService from "@core-ui/ContextServices/SearchQuery";
import SidebarsIsPinService from "@core-ui/ContextServices/Sidebars/SidebarsIsPin";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import GlobalSyncCountService from "@core-ui/ContextServices/SyncCount/GlobalSyncCount";
import SyncableWorkspacesService from "@core-ui/ContextServices/SyncCount/SyncableWorkspaces";
import SyncIconService from "@core-ui/ContextServices/SyncIconService";
import ViewportIntersectionService from "@core-ui/ContextServices/ViewportIntersection";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import LeftNavViewContentService from "@core-ui/ContextServices/views/leftNavView/LeftNavViewContentService";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import WorkspaceAssetsService from "@core-ui/ContextServices/WorkspaceAssetsService";
import useOnUpdateFuncs from "@core-ui/hooks/onUpdate/useOnUpdateFuncs";
import useTauriExternalLinkInterceptor from "@core-ui/hooks/useTauriExternalLinkInterceptor";
import matomoMetric from "@core-ui/matomoMetric";
import { ArticlePropsStoreProvider } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { CatalogStoreProvider } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { DiffStoreProvider } from "@core-ui/stores/DiffStore/DiffStore.provider";
import { ItemLinksStoreProvider } from "@core-ui/stores/ItemLinksStore/ItemLinksStore.provider";
import useIsFirstLoad from "@core-ui/useIsFirstLoad";
import { initRefresh } from "@core-ui/utils/initGlobalFuncs";
import yandexMetric, { yandexHit as yandexMetricHit } from "@core-ui/yandexMetric";
import AgentChatService from "@ext/agent/components/AgentChatService";
import AgentSkillService from "@ext/agent/components/skills/AgentSkillService";
import AudioRecorderService from "@ext/ai/components/Audio/AudioRecorderService";
import PromptServiceProvider from "@ext/ai/components/Tab/PromptService";
import FavoriteService from "@ext/article/Favorite/components/FavoriteService";
import { GesCloudOrganizationStoreProvider } from "@ext/enterprise-cloud/ui-logic/stores/GesCloudOrganizationStore/GesCloudOrganizationStore.provider";
import PublishChangesProvider from "@ext/git/core/GitPublish/PublishChangesProvider";
import InboxService from "@ext/inbox/components/InboxService";
import { CommentsCounterProvider } from "@ext/markdown/elements/comment/edit/logic/stores/CommentsStore";
import FragmentService from "@ext/markdown/elements/fragment/edit/components/Tab/FragmentService";
import { QuestionsProvider } from "@ext/markdown/elements/question/render/logic/QuestionsProvider";
import PropertyService from "@ext/properties/components/PropertyService";
import permissionService from "@ext/security/logic/Permission/components/PermissionService";
import { useHydrateSettings } from "@ext/settings/logic/hooks";
import TemplateService from "@ext/templates/components/TemplateService";
import { feature } from "@ext/toggleFeatures/features";
import { useClientWorkspacePlugins } from "@plugins/bootstrap/useClientWorkspacePlugins";
import { TooltipProvider } from "@ui-kit/Tooltip";
import { useEffect } from "react";
import IsOpenModalService from "../ui-logic/ContextServices/IsOpenMpdal";
import IsMobileService from "../ui-logic/ContextServices/isMobileService";
import ModalToOpenService from "../ui-logic/ContextServices/ModalToOpenService/ModalToOpenService";

const appServices: ContextService[] = [
	pagePropsUpdateService,
	IsMobileService,
	permissionService,
	ApiUrlCreatorService,
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
	const isArticlePage = pageProps?.page === "article";
	const [isFirstLoad, resetIsFirstLoad] = useIsFirstLoad();

	useHydrateSettings(pageProps);
	useMigrateLegacyUiLang();
	// Tauri and static-export platforms load plugins through a different path; only the browser SPA needs this hook.
	useClientWorkspacePlugins({ pageProps, platform });

	if (!pageProps?.context) return children;

	if (isArticlePage && !pageProps.context.language.content)
		pageProps.context.language.content = pageProps.data.catalogProps.language;

	const isProduction = pageProps.context.conf.isProduction;
	const metrics = pageProps.context.conf.metrics;

	if ((platform === "next" || platform === "static") && isProduction) {
		matomoMetric(metrics.matomo);
		yandexMetric(metrics.yandex.metricCounter);

		if (metrics.yandex.metricCounter && platform === "static") {
			const url = useRouter().path;
			// biome-ignore lint/correctness/useExhaustiveDependencies: it's ok
			useEffect(() => yandexMetricHit(metrics.yandex.metricCounter), [url]);
		}
	}

	initRefresh(refreshPage, clearData);
	return (
		<PlatformService.Provider value={platform}>
			<TooltipProvider>
				{Inits.reduceRight(
					(children, Provider) => {
						return (
							<Provider key={Provider.name} pageProps={pageProps}>
								{children}
							</Provider>
						);
					},
					<SidebarsIsPinService.Provider>
						<>
							{isArticlePage ? (
								<NavigationTabInit>
									<CatalogStoreProvider data={pageProps.data.catalogProps}>
										<GitIndexService.Provider>
											<DiffStoreProvider diff={pageProps.data.diff}>
												<ItemLinksStoreProvider itemLinks={pageProps.data.itemLinks ?? []}>
													<ArticlePropsStoreProvider data={pageProps.data.articleProps}>
														{feature("agent-chat") && <AgentChatService.Init />}
														<QuestionsProvider
															path={pageProps.data.articleProps.ref.path}
															questions={pageProps.data.articleProps.questions}
														>
															<ArticleRefService.Provider>
																<ViewportIntersectionService.Provider>
																	<ResourceService.Provider>
																		<CloudStateService.Init
																			value={{
																				cloudServiceUrl:
																					pageProps.context.conf
																						.cloudServiceUrl,
																				catalogName:
																					pageProps.data.catalogProps.name,
																			}}
																		>
																			<CatalogLogoService.Init>
																				<PromptServiceProvider>
																					<InboxService.Provider>
																						<PropertyService.Provider>
																							<TemplateService.Init>
																								<FragmentService.Init>
																									<AgentSkillService.Init>
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
																															<CommentsCounterProvider>
																																{
																																	children
																																}
																															</CommentsCounterProvider>
																														</ViewContextProvider>
																													</OnUpdateAppFuncs>
																												</IsFirstLoadService.Provider>
																											</ArticleTooltipService.Provider>
																										</ModalToOpenService.Provider>
																									</AgentSkillService.Init>
																								</FragmentService.Init>
																							</TemplateService.Init>
																						</PropertyService.Provider>
																					</InboxService.Provider>
																				</PromptServiceProvider>
																			</CatalogLogoService.Init>
																		</CloudStateService.Init>
																	</ResourceService.Provider>
																</ViewportIntersectionService.Provider>
															</ArticleRefService.Provider>
														</QuestionsProvider>
													</ArticlePropsStoreProvider>
												</ItemLinksStoreProvider>
											</DiffStoreProvider>
										</GitIndexService.Provider>
									</CatalogStoreProvider>
								</NavigationTabInit>
							) : (
								<GesCloudOrganizationStoreProvider
									gesCloudUrl={pageProps.context.conf.enterpriseCloud?.url}
								>
									<ModalToOpenService.Provider>
										<IsFirstLoadService.Provider
											resetIsFirstLoad={resetIsFirstLoad}
											value={isFirstLoad}
										>
											<OnUpdateAppFuncs>{children}</OnUpdateAppFuncs>
										</IsFirstLoadService.Provider>
									</ModalToOpenService.Provider>
								</GesCloudOrganizationStoreProvider>
							)}
						</>
					</SidebarsIsPinService.Provider>,
				)}
			</TooltipProvider>
		</PlatformService.Provider>
	);
}

const OnUpdateAppFuncs = ({ children }: { children: JSX.Element }) => {
	useOnUpdateFuncs();
	useTauriExternalLinkInterceptor();
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
