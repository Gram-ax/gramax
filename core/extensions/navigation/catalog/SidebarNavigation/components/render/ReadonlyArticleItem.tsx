import Link from "@components/Atoms/Link";
import Url from "@core-ui/ApiServices/Types/Url";
import { NavigationItemLink } from "@ext/navigation/catalog/SidebarNavigation/components/Helpers/NavigationItemLink";
import { NavigationTreeItemActions } from "@ext/navigation/catalog/SidebarNavigation/components/Helpers/NavigationTreeItemActions";
import { ReadonlyMenuButton } from "@ext/navigation/catalog/SidebarNavigation/components/Helpers/ReadonlyMenuButton";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import { SidebarMenuItem, SidebarMenuSubButton, SidebarMenuSubItem } from "@ui-kit/Sidebar";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import type { MouseEvent, MutableRefObject } from "react";

interface ReadonlyArticleItemProps {
	data: ItemLink;
	level: number;
	isNested: boolean;
	isSelected: boolean;
	onClick: (e: MouseEvent) => void;
	itemRef?: MutableRefObject<HTMLElement>;
}

export const ReadonlyArticleItem = ({
	data,
	level,
	isNested,
	isSelected,
	onClick,
	itemRef,
}: ReadonlyArticleItemProps) => {
	const ItemWrapper = isNested ? SidebarMenuSubItem : SidebarMenuItem;
	const ButtonComponent = isNested ? SidebarMenuSubButton : ReadonlyMenuButton;
	const isLinkInsideButton = isNested && !isSelected;

	const body = (
		<>
			<span className="flex min-w-0 flex-1 items-center gap-2">
				<TextOverflowTooltip>{data?.title || data?.external || <>&nbsp;</>}</TextOverflowTooltip>
			</span>
			<NavigationTreeItemActions itemLink={data} />
		</>
	);

	return (
		<NavigationItemLink data={data} disabled={isSelected || isNested}>
			<ItemWrapper
				className="relative select-none hover:cursor-pointer"
				data-qa={`catalog-navigation-article-link-level-${level}`}
				ref={(el) => {
					if (itemRef) itemRef.current = el as HTMLElement;
				}}
			>
				<ButtonComponent
					className="group/nav h-7 py-1.5 pr-1.5 font-light"
					isActive={isSelected}
					onClick={onClick}
					title={data?.title || data?.external}
					{...(isLinkInsideButton ? { asChild: true } : { type: "button" })}
				>
					{isLinkInsideButton ? <Link href={Url.from(data)}>{body}</Link> : body}
				</ButtonComponent>
			</ItemWrapper>
		</NavigationItemLink>
	);
};
