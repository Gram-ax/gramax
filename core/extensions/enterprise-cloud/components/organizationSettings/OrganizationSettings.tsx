import LucideIconComponent from "@components/Atoms/Icon/LucideIcon";
import styled from "@emotion/styled";
import { PageComponents } from "@ext/enterprise-cloud/components/organizationSettings/PageComponents";
import GesCloudOrgSettingsPage from "@ext/enterprise-cloud/types/GesCloudOrgSettingsPage";
import t from "@ext/localization/locale/translate";
import { Dialog, DialogContent, DialogHeaderTemplate } from "@ui-kit/Dialog";
import { Icon } from "@ui-kit/Icon";
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
} from "@ui-kit/Sidebar";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
	OrganizationSettingsNavigationProvider,
	useOrganizationSettingsNavigation,
} from "./OrganizationSettingsNavigationContext";

//TODO: duplication with Admin.tsx and should be deleted because of new changes in ui-kit
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

function MainContent({ isOpen }: { isOpen: boolean }) {
	const { page, tryNavigate, tryCloseModal } = useOrganizationSettingsNavigation();

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				tryCloseModal();
			}
		},
		[tryCloseModal],
	);

	const Component = PageComponents[page];

	useEffect(() => {
		const url = new URL(window.location.href);
		url.search = "";
		window.history.replaceState(null, "", url.toString());
	}, []);

	return (
		<Dialog onOpenChange={onOpenChange} open={isOpen}>
			<DialogContent size="FS">
				<DialogHeaderTemplate
					description={t("enterprise-cloud.org-settings.description")}
					icon={LucideIconComponent("settings") as LucideIcon}
					title={t("enterprise-cloud.org-settings.title")}
				/>
				<SidebarContainer>
					<Sidebar className="h-full" collapsible="none">
						<SidebarContent>
							<SidebarGroup>
								<SidebarGroupContent>
									<SidebarMenu>
										<SidebarMenuItem>
											<SidebarMenuButton
												isActive={page === GesCloudOrgSettingsPage.ORGANIZATION}
												onClick={() => tryNavigate(GesCloudOrgSettingsPage.ORGANIZATION)}
											>
												<Icon icon="building" />
												<span>{t("enterprise-cloud.org-settings.pages.organization")}</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
										<SidebarMenuItem>
											<SidebarMenuButton
												isActive={page === GesCloudOrgSettingsPage.MEMBERS}
												onClick={() => tryNavigate(GesCloudOrgSettingsPage.MEMBERS)}
											>
												<Icon icon="users" />
												<span>{t("enterprise-cloud.org-settings.pages.users")}</span>
											</SidebarMenuButton>
										</SidebarMenuItem>
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						</SidebarContent>
						<SidebarSeparator />
						<SidebarRail />
					</Sidebar>
					<main className="w-full max-w-full overflow-hidden">
						<div className="flex-1 h-full" style={{ overflowY: "scroll", paddingBottom: "24px" }}>
							{Component ? <Component /> : null}
						</div>
					</main>
				</SidebarContainer>
			</DialogContent>
		</Dialog>
	);
}

export const GesCloudOrganizationSettingsModal = ({ onClose }: { onClose: () => void }) => {
	const [isOpen, setIsOpen] = useState(true);

	const closeHandler = useCallback(() => {
		setIsOpen(false);
		onClose();
	}, [onClose]);

	return (
		<OrganizationSettingsNavigationProvider onClose={closeHandler}>
			<MainContent isOpen={isOpen} />
		</OrganizationSettingsNavigationProvider>
	);
};
