import Link from "@components/Atoms/Link";
import Url from "@core-ui/ApiServices/Types/Url";
import { cn } from "@core-ui/utils/cn";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { useNavigationItemClick } from "@ext/navigation/catalog/SidebarNavigation/hooks/useNavigationItemClick";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import { SidebarMenuItem, SidebarMenuSubButton, SidebarMenuSubItem } from "@ui-kit/Sidebar";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { memo, type ReactNode } from "react";
import { NavigationIndicator } from "./NavigationIndicator";
import { NavigationItemCommentCounter } from "./NavigationItemCommentCounter";
import { NavigationItemLink } from "./NavigationItemLink";
import { NavigationTreeItemActions } from "./NavigationTreeItemActions";
import { SidebarMenuButton } from "./SidebarMenuButton";

export interface SideMenuItemContentProps {
	isNested: boolean;
	isCategory: boolean;
	level: number;
	data: ItemLink;
	isSelected: boolean;
	onSelect: () => void;
	trigger?: ReactNode;
	isDragging?: boolean;
	isHighlighted?: boolean;
	onAddChild?: () => void;
	draggableRef?: (el: HTMLElement | null) => void;
	dragListeners?: DraggableSyntheticListeners;
	dragAttributes?: DraggableAttributes;
}

interface SideMenuItemBodyProps {
	data: ItemLink;
	trigger?: ReactNode;
	onAddChild?: () => void;
}

const SideMenuItemBody = ({ data, trigger, onAddChild }: SideMenuItemBodyProps) => (
	<>
		<span className="flex min-w-0 flex-1 items-center gap-2">
			<TextOverflowTooltip>{data?.title || data?.external || <>&nbsp;</>}</TextOverflowTooltip>
			<NavigationItemCommentCounter pathname={data.pathname} />
			{trigger}
		</span>
		<NavigationTreeItemActions itemLink={data} onAddChild={onAddChild} />
	</>
);

const SideMenuItemContentInner = (props: SideMenuItemContentProps) => {
	const {
		isNested,
		isCategory,
		level,
		data,
		isSelected,
		onSelect,
		trigger,
		isDragging,
		isHighlighted,
		onAddChild,
		draggableRef,
		dragListeners,
		dragAttributes,
	} = props;
	const ItemWrapper = isNested ? SidebarMenuSubItem : SidebarMenuItem;
	const ButtonComponent = isNested ? SidebarMenuSubButton : SidebarMenuButton;
	const isLinkInsideButton = isNested && !isSelected;

	const handleItemClick = useNavigationItemClick({ itemPath: data?.pathname, isSelected, onSelect });

	const body = <SideMenuItemBody data={data} onAddChild={onAddChild} trigger={trigger} />;

	return (
		<NavigationItemLink data={data} disabled={isSelected || isNested}>
			<ItemWrapper
				className={cn("relative select-none hover:cursor-pointer", isDragging && "opacity-50")}
				data-qa={`catalog-navigation-${isCategory ? "category" : "article"}-link-level-${level}`}
				ref={draggableRef}
			>
				{data.ref.path && <NavigationIndicator level={level} path={data.ref.path} />}
				<ButtonComponent
					className={cn(
						"group/nav h-7 py-1.5 pr-1.5 data-[active=true]:font-medium font-light",
						"data-[active=true]:hover:bg-primary-bg-hover data-[active=true]:hover:text-primary-accent",
						isHighlighted && "bg-secondary-bg-hover",
						data?.external && "text-secondary-fg/60",
					)}
					isActive={isSelected}
					onClick={handleItemClick}
					title={data?.title || data?.external}
					{...dragListeners}
					{...dragAttributes}
					{...(isLinkInsideButton ? { asChild: true } : { type: "button" })}
				>
					{isLinkInsideButton ? <Link href={Url.from(data)}>{body}</Link> : body}
				</ButtonComponent>
			</ItemWrapper>
		</NavigationItemLink>
	);
};

export const SideMenuItemContent = memo(SideMenuItemContentInner);
