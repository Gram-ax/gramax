import Link from "@components/Atoms/Link";
import Url from "@core-ui/ApiServices/Types/Url";
import { NavigationCollapseChevron } from "@ext/navigation/catalog/SidebarNavigation/components/Helpers/NavigationCollapseChevron";
import { NavigationItemLink } from "@ext/navigation/catalog/SidebarNavigation/components/Helpers/NavigationItemLink";
import { NavigationTreeItemActions } from "@ext/navigation/catalog/SidebarNavigation/components/Helpers/NavigationTreeItemActions";
import { ReadonlyMenuButton } from "@ext/navigation/catalog/SidebarNavigation/components/Helpers/ReadonlyMenuButton";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import { SidebarMenuItem, SidebarMenuSubButton, SidebarMenuSubItem } from "@ui-kit/Sidebar";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import type { MouseEvent } from "react";

interface ReadonlyFolderItemProps {
	data: ItemLink;
	level: number;
	open: boolean;
	isNested: boolean;
	isSelected: boolean;
	onClick: (e: MouseEvent) => void;
}

export const ReadonlyFolderItem = ({ data, level, open, isNested, isSelected, onClick }: ReadonlyFolderItemProps) => {
	const ItemWrapper = isNested ? SidebarMenuSubItem : SidebarMenuItem;
	const ButtonComponent = isNested ? SidebarMenuSubButton : ReadonlyMenuButton;

	const body = (
		<>
			<span className="flex min-w-0 flex-1 items-center gap-2">
				<TextOverflowTooltip>{data?.title || data?.external || <>&nbsp;</>}</TextOverflowTooltip>
				<NavigationCollapseChevron open={open} />
			</span>
			<NavigationTreeItemActions itemLink={data} />
		</>
	);

	return (
		<NavigationItemLink data={data} disabled={isNested}>
			<ItemWrapper
				className="relative select-none hover:cursor-pointer"
				data-qa={`catalog-navigation-category-link-level-${level}`}
			>
				<ButtonComponent
					className="group/nav h-7 min-w-0 py-1.5 pr-1.5 font-light"
					isActive={isSelected}
					onClick={onClick}
					title={data?.title || data?.external}
					{...(isNested ? { asChild: true } : { type: "button" })}
				>
					{isNested ? <Link href={Url.from(data)}>{body}</Link> : body}
				</ButtonComponent>
			</ItemWrapper>
		</NavigationItemLink>
	);
};
