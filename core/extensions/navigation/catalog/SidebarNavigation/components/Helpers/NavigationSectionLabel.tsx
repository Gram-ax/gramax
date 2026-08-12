import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import { useRouter } from "@core/Api/useRouter";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import { Icon } from "@ui-kit/Icon";
import { SidebarGroupLabel } from "@ui-kit/Sidebar";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { useCallback } from "react";
import { NavigationItemCommentCounter } from "./NavigationItemCommentCounter";
import { NavigationTreeItemActions } from "./NavigationTreeItemActions";

interface NavigationSectionLabelProps {
	data: ItemLink;
	icon?: IconCode;
}

export const NavigationSectionLabel = ({ data, icon = "layers3" }: NavigationSectionLabelProps) => {
	const router = useRouter();

	const handleClick = useCallback(() => {
		if (data.pathname) router.pushPath(data.pathname);
	}, [data?.pathname, router]);

	return (
		<SidebarGroupLabel
			className="group/nav mb-0.5 h-8 select-none cursor-pointer gap-2 p-2 pr-1.5 text-muted hover:bg-secondary-bg-hover hover:text-secondary-fg"
			onClick={handleClick}
		>
			<Icon icon={icon} />
			<TextOverflowTooltip className="text-xs font-medium">{data.title}</TextOverflowTooltip>
			<NavigationItemCommentCounter pathname={data.pathname} />
			<NavigationTreeItemActions itemLink={data} />
		</SidebarGroupLabel>
	);
};
