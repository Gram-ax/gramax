import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import {
	AdminPageDataProvider,
	useAdminPageData,
} from "@ext/enterprise/components/admin/contexts/AdminPageDataContext";
import { OpenProvider } from "@ext/enterprise/components/admin/contexts/OpenContext";
import { ScrollContainerProvider } from "@ext/enterprise/components/admin/contexts/ScrollContainerContext";
import { SettingsProvider, useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import ForbiddenPage from "@ext/enterprise/components/admin/pages/ForbiddenPage";
import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
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
	SidebarProvider,
	SidebarRail,
	SidebarSeparator,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@ui-kit/Sidebar";
import { Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface BaseProps {
	token: string;
	enterpriseService: EnterpriseService;
}

interface MainContentProps extends BaseProps {
	page: Page;
	onNavigate: (p: Page) => void;
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

function MainContent({ page, onNavigate, enterpriseService, token }: MainContentProps) {
	const {
		settings,
		error,
		ensureGroupsLoaded,
		ensureMailLoaded,
		ensureGuestsLoaded,
		ensureWorkspaceLoaded,
		ensureEditorsLoaded,
		ensureResourcesLoaded,
		ensureCheckLoaded,
		ensureQuizLoaded,
	} = useSettings();

	const [selectAllResources, setSelectAllResources] = useState<string[]>([]);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const { params } = useAdminPageData();

	useEffect(() => {
		(async () => {
			let pageNum = 1;
			const pageSize = 100;
			let acc: string[] = [];

			// eslint-disable-next-line no-constant-condition
			while (true) {
				const res = await enterpriseService.getResources(token, pageNum);
				if (!res) break;

				const { repos } = res;
				acc = acc.concat(repos ?? []);
				pageNum++;

				if (!repos || repos.length < pageSize) break;
			}

			setSelectAllResources(acc);
		})();
	}, []);

	useEffect(() => {
		switch (page) {
			case Page.WORKSPACE:
				ensureWorkspaceLoaded();
				ensureResourcesLoaded();
				ensureGroupsLoaded();
				break;
			case Page.EDITORS:
				ensureEditorsLoaded();
				break;
			case Page.RESOURCES:
				ensureWorkspaceLoaded();
				ensureGroupsLoaded();
				ensureGuestsLoaded();
				ensureResourcesLoaded();
				break;
			case Page.USER_GROUPS:
				ensureResourcesLoaded();
				ensureGroupsLoaded();
				break;
			case Page.CHECK:
				ensureCheckLoaded();
				break;
			case Page.MAIL:
				ensureMailLoaded();
				break;
			case Page.GUESTS:
				ensureGuestsLoaded();
				break;
			case Page.QUIZ:
				ensureQuizLoaded();
				break;
		}
	}, [page]);

	if (error) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="w-full max-w-md">
					<Alert status="error" focus="medium">
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

	const Component = PageComponents[page];

	return (
		<SidebarContainer>
			<Sidebar collapsible="none" className="h-full">
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										isActive={page === Page.WORKSPACE}
										onClick={() => onNavigate(Page.WORKSPACE)}
									>
										<Icon icon="layers" />
										<span>{getAdminPageTitle(Page.WORKSPACE)}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton
										isActive={page === Page.USER_GROUPS}
										onClick={() => onNavigate(Page.USER_GROUPS)}
									>
										<Icon icon="users" />
										<span>{getAdminPageTitle(Page.USER_GROUPS)}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton
										isActive={page === Page.EDITORS}
										onClick={() => onNavigate(Page.EDITORS)}
									>
										<Icon icon="user-round-pen" />
										<span>{getAdminPageTitle(Page.EDITORS)}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton
										isActive={page === Page.RESOURCES}
										onClick={() => onNavigate(Page.RESOURCES)}
									>
										<Icon icon="git-branch" />
										<span>{getAdminPageTitle(Page.RESOURCES)}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton
										isActive={page === Page.MAIL}
										onClick={() => onNavigate(Page.MAIL)}
									>
										<Icon icon="mail" />
										<span>{getAdminPageTitle(Page.MAIL)}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<SidebarMenuItem>
									<SidebarMenuButton
										isActive={page === Page.GUESTS}
										onPointerDown={() => onNavigate(Page.GUESTS)}
									>
										<Icon icon="users" />
										<span>{getAdminPageTitle(Page.GUESTS)}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
								<Collapsible className="group/sidebar-menu">
									<CollapsibleTrigger asChild>
										<SidebarMenuButton>
											<Icon icon="package" />
											<span>{t("enterprise.admin.pages.modules")}</span>
											<Icon
												icon="chevron-right"
												className="ml-auto transition-transform group-data-[state=open]/sidebar-menu:rotate-90"
											/>
										</SidebarMenuButton>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											<SidebarMenuSubItem>
												<SidebarMenuSubButton
													isActive={page === Page.CHECK}
													onClick={() => onNavigate(Page.CHECK)}
												>
													<Icon icon="file-check2" />
													<span>{getAdminPageTitle(Page.CHECK)}</span>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
											{params.dataProviderAvailable && (
												<SidebarMenuSubItem>
													<SidebarMenuSubButton
														isActive={page === Page.QUIZ}
														onPointerDown={() => onNavigate(Page.QUIZ)}
													>
														<Icon icon="file-question-mark" />
														<span>{getAdminPageTitle(Page.QUIZ)}</span>
													</SidebarMenuSubButton>
												</SidebarMenuSubItem>
											)}
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
				<div className="flex-1 p-6 h-full" ref={scrollContainerRef} style={{ overflowY: "scroll" }}>
					<ScrollContainerProvider container={scrollContainerRef.current}>
						{Component && <Component selectAllResources={selectAllResources} />}
					</ScrollContainerProvider>
				</div>
			</main>
		</SidebarContainer>
	);
}

function TabPage({ enterpriseService, token }: BaseProps) {
	const { page, setPage, setParams } = useAdminPageData();

	useEffect(() => {
		enterpriseService.checkDataProviderHealth().then((available) => {
			setParams((params) => ({ ...params, dataProviderAvailable: available }));
		});
	}, []);

	useEffect(() => {
		const url = new URL(window.location.href);
		url.search = "";
		window.history.replaceState(null, "", url.toString());
	}, []);

	return (
		<MainContent page={page} onNavigate={(p) => setPage(p)} enterpriseService={enterpriseService} token={token} />
	);
}

const AdminModalContent = ({ enterpriseService, token }: BaseProps) => {
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
				title={t("enterprise.admin.settings-title")}
				description={t("enterprise.admin.settings-description")}
				icon={Settings}
			/>
			<AdminPageDataProvider>
				<SettingsProvider enterpriseService={enterpriseService} token={token}>
					<TabPage enterpriseService={enterpriseService} token={token} />
				</SettingsProvider>
			</AdminPageDataProvider>
		</ModalContent>
	);
};

export const Admin = ({ onClose, gesUrl }: { onClose: () => void; gesUrl: string }) => {
	const [isOpen, setIsOpen] = useState(true);
	const sourceDatas = SourceDataService.value;
	const enterpriseService = useMemo(() => new EnterpriseService(gesUrl), [gesUrl]);
	const token = useMemo(() => getEnterpriseSourceData(sourceDatas, gesUrl)?.token, [gesUrl, sourceDatas]);

	const onOpenChange = useCallback(
		(open: boolean) => {
			setIsOpen(open);
			if (!open) onClose();
		},
		[onClose],
	);

	return (
		<Modal open={isOpen} onOpenChange={onOpenChange}>
			<OpenProvider open={isOpen} setOpen={onOpenChange}>
				<AdminModalContent enterpriseService={enterpriseService} token={token} />
			</OpenProvider>
		</Modal>
	);
};
