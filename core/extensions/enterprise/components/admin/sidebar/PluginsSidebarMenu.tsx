import type { PluginDetailParams } from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import type { AdminNavigateFunction } from "@ext/enterprise/components/admin/hooks/useWorkspaceEditorOptions";
import { SidePluginIcon } from "@ext/enterprise/components/admin/settings/plugins/plugin.common";
import { AdminPageGroupSidebarItemTrigger } from "@ext/enterprise/components/admin/sidebar/AdminPageSidebarItem";
import { AdminSidebarMenuSubButton } from "@ext/enterprise/components/admin/sidebar/AdminSidebarMenuSubButton";
import { pluginsPageModel } from "@ext/enterprise/model/AdminPageModel";
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

	return (
		<Collapsible className="group/sidebar-menu">
			<AdminPageGroupSidebarItemTrigger
				activePage={activePage}
				model={pluginsPageModel}
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
