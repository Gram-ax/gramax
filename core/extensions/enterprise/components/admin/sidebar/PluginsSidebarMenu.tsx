import type { PluginDetailParams } from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import type { AdminNavigateFunction } from "@ext/enterprise/components/admin/hooks/useAdminPage";
import { useSidebarGroupOpen } from "@ext/enterprise/components/admin/hooks/useSidebarGroupOpen";
import { SidePluginIcon } from "@ext/enterprise/components/admin/settings/plugins/plugin.common";
import { AdminPageGroupSidebarItemTrigger } from "@ext/enterprise/components/admin/sidebar/AdminPageSidebarItem";
import { AdminSidebarMenuSubButton } from "@ext/enterprise/components/admin/sidebar/AdminSidebarMenuSubButton";
import { getGroupTargetPage, pluginsPageDescriptor } from "@ext/enterprise/model/AdminPageModel";
import type { Settings } from "@ext/enterprise/types/EnterpriseAdmin";
import { Page } from "@ext/enterprise/types/Page";
import { Collapsible, CollapsibleContent } from "@ui-kit/Collapsible";
import { Icon } from "@ui-kit/Icon";
import { SidebarMenuSub, SidebarMenuSubItem } from "@ui-kit/Sidebar";

export interface PluginsSidebarMenuProps {
	settings: Readonly<Partial<Settings>>;
	pageParams: PluginDetailParams;
	activePage: Page;
	tryNavigate: AdminNavigateFunction;
}

export const PluginsSidebarMenu = (props: PluginsSidebarMenuProps) => {
	const { settings, activePage, pageParams, tryNavigate } = props;

	const containsActivePage =
		activePage === Page.PLUGINS ||
		activePage === Page.PLUGIN_DETAIL ||
		(settings?.plugins?.plugins ?? []).some((plugin) => plugin.metadata.navigateTo === activePage);
	const { open, setOpen, onItemClick } = useSidebarGroupOpen(
		containsActivePage,
		activePage === getGroupTargetPage(pluginsPageDescriptor),
	);

	return (
		<Collapsible className="group/sidebar-menu" onOpenChange={setOpen} open={open}>
			<AdminPageGroupSidebarItemTrigger
				activePage={activePage}
				model={pluginsPageDescriptor}
				onItemClick={onItemClick}
				tryNavigate={tryNavigate}
			/>
			<CollapsibleContent>
				<SidebarMenuSub className="border-none">
					{settings?.plugins?.plugins
						.filter((plugin) => !(plugin.metadata.isBuiltIn && !plugin.metadata.navigateTo))
						.map((plugin) => {
							const isBuiltIn = plugin.metadata.isBuiltIn;
							const navigateTo = plugin.metadata.navigateTo;
							const isActive = isBuiltIn
								? activePage === navigateTo
								: activePage === Page.PLUGIN_DETAIL &&
									pageParams?.selectedPluginId === plugin.metadata.id;

							return (
								<SidebarMenuSubItem key={plugin.metadata.id}>
									<AdminSidebarMenuSubButton
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
											<SidePluginIcon disabled={plugin.metadata.disabled} />
										)}
										<span>{plugin.metadata.name}</span>
									</AdminSidebarMenuSubButton>
								</SidebarMenuSubItem>
							);
						})}
				</SidebarMenuSub>
			</CollapsibleContent>
		</Collapsible>
	);
};
