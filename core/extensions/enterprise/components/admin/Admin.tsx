import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import {
	AdminNavigationProvider,
	type PluginDetailParams,
	useAdminNavigation,
} from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import { OpenProvider } from "@ext/enterprise/components/admin/contexts/OpenContext";
import { ScrollContainerProvider } from "@ext/enterprise/components/admin/contexts/ScrollContainerContext";
import { SettingsProvider, useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { GuardProvider, useGuard } from "@ext/enterprise/components/admin/hooks/useGuard";
import ForbiddenPage from "@ext/enterprise/components/admin/pages/ForbiddenPage";
import { SidePluginIcon } from "@ext/enterprise/components/admin/settings/plugins/plugin.common";
import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { getPageDataLoader } from "@ext/enterprise/components/admin/utils/pageDataLoaders";
import EnterpriseService from "@ext/enterprise/EnterpriseService";
import { Page, PageComponents } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import { useAdminGate } from "@ext/enterprise/utils/useAdminGate";
import t from "@ext/localization/locale/translate";
import { styled } from "@mui/material";
import { Alert, AlertDescription } from "@ui-kit/Alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui-kit/Collapsible";
import { Icon } from "@ui-kit/Icon";
import { Modal, ModalContent, ModalHeaderTemplate } from "@ui-kit/Modal";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
} from "@ui-kit/Sidebar";
import { Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface BaseProps {
	token: string;
	enterpriseService: EnterpriseService;
}

const SidebarContainer = styled(SidebarProvider)`
  height: 100%;
  min-height: unset;
  max-height: 100%;
  overflow: hidden;

  ul {
    list-style: none !important;
  }

  li {
    line-height: unset;
    margin-bottom: unset;
  }
`;

const PageRenderer = () => {
	const { page } = useAdminNavigation();
	const Component = PageComponents[page];
	if (!Component) return null;
	return <Component />;
};

function MainContent() {
	const {
		settings,
		error,
		ensureGroupsLoaded,
		ensureMailLoaded,
		ensureGuestsLoaded,
		ensureWorkspaceLoaded,
		ensureEditorsLoaded,
		ensureResourcesLoaded,
		ensureStyleGuideLoaded,
		ensureQuizLoaded,
		ensurePluginsLoaded,
		ensureMetricsLoaded,
		ensureSearchMetricsLoaded,
	} = useSettings();

	const { page, pageParams, navigate } = useAdminNavigation();
	const { getGuard, showUnsavedChangesModal } = useGuard();
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const tryNavigate = useCallback(
		async (nextPage: Page, params?: { selectedPluginId: string }) => {
			if (nextPage === page) return;
			const currentGuard = getGuard(page);
			if (currentGuard?.hasChanges()) {
				showUnsavedChangesModal(
					currentGuard,
					() => navigate(nextPage, params),
					() => navigate(nextPage, params),
				);
				return;
			}
			navigate(nextPage, params);
		},
		[page, getGuard, navigate, showUnsavedChangesModal],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: fix later
	useEffect(() => {
		const loadData = getPageDataLoader(page);

		void loadData?.({
			ensureWorkspaceLoaded,
			ensureGroupsLoaded,
			ensureEditorsLoaded,
			ensureResourcesLoaded,
			ensureMailLoaded,
			ensureGuestsLoaded,
			ensureStyleGuideLoaded,
			ensureQuizLoaded,
			ensurePluginsLoaded,
			ensureMetricsLoaded,
			ensureSearchMetricsLoaded,
		});
	}, [page]);

	if (error) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="w-full max-w-md">
					<Alert focus="medium" status="error">
						<AlertDescription>{t("enterprise.admin.error.loading-settings")}</AlertDescription>
					</Alert>
				</div>
			</div>
		);
	}

	if (!settings) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Spinner size="xl" />
			</div>
		);
	}

	return (
		<SidebarContainer>
			<Sidebar className="h-full" collapsible="none">
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										isActive={page === Page.WORKSPACE}
										onClick={() => void tryNavigate(Page.WORKSPACE)}
									>
										<Icon icon="layers" />
										<span>{getAdminPageTitle(Page.WORKSPACE)}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton
										isActive={page === Page.USER_GROUPS}
										onClick={() => void tryNavigate(Page.USER_GROUPS)}
									>
										<Icon icon="users" />
										<span>{getAdminPageTitle(Page.USER_GROUPS)}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton
										isActive={page === Page.EDITORS}
										onClick={() => void tryNavigate(Page.EDITORS)}
									>
										<Icon icon="user-round-pen" />
										<span>{getAdminPageTitle(Page.EDITORS)}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton
										isActive={page === Page.RESOURCES}
										onClick={() => void tryNavigate(Page.RESOURCES)}
									>
										<Icon icon="git-branch" />
										<span>{getAdminPageTitle(Page.RESOURCES)}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton
										isActive={page === Page.MAIL}
										onClick={() => void tryNavigate(Page.MAIL)}
									>
										<Icon icon="mail" />
										<span>{getAdminPageTitle(Page.MAIL)}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton
										isActive={page === Page.GUESTS}
										onClick={() => void tryNavigate(Page.GUESTS)}
									>
										<Icon icon="users" />
										<span>{getAdminPageTitle(Page.GUESTS)}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<Collapsible className="group/sidebar-menu">
									<CollapsibleTrigger asChild>
										<SidebarMenuSubItem>
											<SidebarMenuButton
												isActive={page === Page.METRICS}
												onClick={() => void tryNavigate(Page.METRICS)}
											>
												<Icon icon="chart-bar" />
												<span>{getAdminPageTitle(Page.METRICS)}</span>
												<Icon
													className="ml-auto transition-transform group-data-[state=open]/sidebar-menu:rotate-90"
													icon="chevron-right"
												/>
											</SidebarMenuButton>
										</SidebarMenuSubItem>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													isActive={page === Page.VIEW_METRICS}
													onClick={() => void tryNavigate(Page.VIEW_METRICS)}
												>
													<Icon icon="eye" />
													<span>{getAdminPageTitle(Page.VIEW_METRICS)}</span>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													isActive={page === Page.SEARCH_METRICS}
													onClick={() => void tryNavigate(Page.SEARCH_METRICS)}
												>
													<Icon icon="search" />
													<span>{getAdminPageTitle(Page.SEARCH_METRICS)}</span>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										</SidebarMenuSub>
									</CollapsibleContent>
								</Collapsible>
								<Collapsible className="group/sidebar-menu">
									<CollapsibleTrigger asChild>
										<SidebarMenuSubItem>
											<SidebarMenuButton
												isActive={page === Page.PLUGINS}
												onClick={() => void tryNavigate(Page.PLUGINS)}
											>
												<Icon icon="package" />
												<span>{t("enterprise.admin.pages.modules")}</span>
												<Icon
													className="ml-auto transition-transform group-data-[state=open]/sidebar-menu:rotate-90"
													icon="chevron-right"
												/>
											</SidebarMenuButton>
										</SidebarMenuSubItem>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											{settings?.plugins?.plugins
												.filter(
													(plugin) =>
														!(plugin.metadata.isBuiltIn && !plugin.metadata.navigateTo),
												)
												.map((plugin) => {
													const isBuiltIn = plugin.metadata.isBuiltIn;
													const navigateTo = plugin.metadata.navigateTo;
													const isActive = isBuiltIn
														? page === navigateTo
														: page === Page.PLUGIN_DETAIL &&
															(pageParams as PluginDetailParams)?.selectedPluginId ===
																plugin.metadata.id;

													return (
														<SidebarMenuSubItem key={plugin.metadata.id}>
															<SidebarMenuSubButton
																isActive={isActive}
																onClick={() => {
																	if (isBuiltIn && navigateTo) {
																		void tryNavigate(navigateTo as Page);
																	} else {
																		void tryNavigate(Page.PLUGIN_DETAIL, {
																			selectedPluginId: plugin.metadata.id,
																		});
																	}
																}}
															>
																{plugin.metadata.icon ? (
																	<Icon icon={plugin.metadata.icon} />
																) : (
																	<SidePluginIcon
																		disabled={plugin.metadata.disabled}
																	/>
																)}
																<span>{plugin.metadata.name}</span>
															</SidebarMenuSubButton>
														</SidebarMenuSubItem>
													);
												})}
										</SidebarMenuSub>
									</CollapsibleContent>
								</Collapsible>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarSeparator />
				<SidebarRail />
			</Sidebar>
			<main className="w-full max-w-full overflow-hidden">
				<div
					className="flex-1 h-full"
					ref={scrollContainerRef}
					style={{ overflowY: "scroll", paddingBottom: "24px" }}
				>
					<ScrollContainerProvider container={scrollContainerRef.current}>
						<PageRenderer />
					</ScrollContainerProvider>
				</div>
			</main>
		</SidebarContainer>
	);
}

function TabPage() {
	useEffect(() => {
		const url = new URL(window.location.href);
		url.search = "";
		window.history.replaceState(null, "", url.toString());
	}, []);

	return <MainContent />;
}

interface AdminModalContentProps extends BaseProps {
	onRequestClose: () => void;
	guardedCloseRef: React.MutableRefObject<(() => void) | null>;
}

const AdminModalContent = ({ enterpriseService, token, onRequestClose, guardedCloseRef }: AdminModalContentProps) => {
	const { loading, forbidden } = useAdminGate({
		token,
		enterpriseService,
		onErrorPolicy: "forbid",
	});

	if (loading) return <TabInitialLoader />;
	if (forbidden) return <ForbiddenPage />;

	return (
		<ModalContent size="FS">
			<ModalHeaderTemplate
				description={t("enterprise.admin.settings-description")}
				icon={Settings}
				title={t("enterprise.admin.settings-title")}
			/>
			<AdminNavigationProvider>
				<GuardProvider>
					<SettingsProvider enterpriseService={enterpriseService} token={token}>
						<ModalCloseGuard guardedCloseRef={guardedCloseRef} onRequestClose={onRequestClose}>
							<TabPage />
						</ModalCloseGuard>
					</SettingsProvider>
				</GuardProvider>
			</AdminNavigationProvider>
		</ModalContent>
	);
};

const ModalCloseGuard = ({
	children,
	onRequestClose,
	guardedCloseRef,
}: {
	children: React.ReactNode;
	onRequestClose: () => void;
	guardedCloseRef: React.MutableRefObject<(() => void) | null>;
}) => {
	const { page } = useAdminNavigation();
	const { getGuard, showUnsavedChangesModal } = useGuard();

	const handleClose = useCallback(() => {
		const guard = getGuard(page);
		if (guard?.hasChanges()) {
			showUnsavedChangesModal(guard, onRequestClose, onRequestClose);
		} else {
			onRequestClose();
		}
	}, [page, getGuard, showUnsavedChangesModal, onRequestClose]);

	useEffect(() => {
		guardedCloseRef.current = handleClose;
		return () => {
			guardedCloseRef.current = null;
		};
	}, [handleClose, guardedCloseRef]);

	return <>{children}</>;
};

export const Admin = ({ onClose, gesUrl }: { onClose: () => void; gesUrl: string }) => {
	const [isOpen, setIsOpen] = useState(true);
	const sourceDatas = SourceDataService.value;
	const enterpriseService = useMemo(() => new EnterpriseService(gesUrl), [gesUrl]);
	const token = useMemo(() => getEnterpriseSourceData(sourceDatas, gesUrl)?.token, [gesUrl, sourceDatas]);
	const guardedCloseRef = useRef<(() => void) | null>(null);

	const handleRequestClose = useCallback(() => {
		setIsOpen(false);
		onClose();
	}, [onClose]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				if (guardedCloseRef.current) {
					guardedCloseRef.current();
				} else {
					handleRequestClose();
				}
			}
		},
		[handleRequestClose],
	);

	return (
		<Modal onOpenChange={onOpenChange} open={isOpen}>
			<OpenProvider open={isOpen} setOpen={setIsOpen}>
				<AdminModalContent
					enterpriseService={enterpriseService}
					guardedCloseRef={guardedCloseRef}
					onRequestClose={handleRequestClose}
					token={token}
				/>
			</OpenProvider>
		</Modal>
	);
};
