import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import { Icon } from "@ui-kit/Icon";
import { SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@ui-kit/Sidebar";

type SidebarItemType = "button" | "title";

type BaseSidebarItem = { type: SidebarItemType; key: string; label: string; shouldShow?: () => boolean };

type SidebarButtonItem = BaseSidebarItem & { type: "button"; icon: IconCode };

type SidebarTitle = BaseSidebarItem & { type: "title"; icon?: undefined };

export type SidebarItem = BaseSidebarItem & (SidebarButtonItem | SidebarTitle);

type AppSettingsSidebarTabsRendererProps = {
	items: SidebarItem[];
	active: string;
	onChange: (key: string) => void;
};

export const AppSettingsSidebarTabsRenderer = ({ items, active, onChange }: AppSettingsSidebarTabsRendererProps) => (
	<SidebarMenu>
		{items.map((item) =>
			item.type === "button" ? (
				<SidebarMenuItem key={item.key}>
					<SidebarMenuButton isActive={active === item.key} onClick={() => onChange(item.key)}>
						<Icon icon={item.icon} />
						<span>{item.label}</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			) : (
				<SidebarGroupLabel key={item.key}>
					<span>{item.label}</span>
				</SidebarGroupLabel>
			),
		)}
	</SidebarMenu>
);
