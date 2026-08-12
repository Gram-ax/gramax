import { cn } from "@core-ui/utils/cn";
import EditMenu from "@ext/item/EditMenu";
import t from "@ext/localization/locale/translate";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useState } from "react";

interface NavigationTreeItemActionsProps {
	itemLink?: ItemLink;
	onAddChild?: () => void;
	isDndActive?: boolean;
}

export const NavigationTreeItemActions = ({ itemLink, onAddChild, isDndActive }: NavigationTreeItemActionsProps) => {
	const [currentItemLink, setCurrentItemLink] = useState<ItemLink>(itemLink);

	const moreButton = (
		<span>
			<Tooltip>
				<TooltipTrigger asChild>
					<span
						className="hover:bg-sidebar-accent group/actions flex size-5 items-center justify-center rounded text-muted-foreground"
						data-testid="article-actions"
					>
						<Icon className="group-hover/actions:text-primary-fg" icon="more-horizontal" />
					</span>
				</TooltipTrigger>
				<TooltipContent focus="high">{t("article.actions.title")}</TooltipContent>
			</Tooltip>
		</span>
	);

	return (
		<span
			className={cn(
				"right-extensions ml-auto flex w-0 shrink-0 items-center gap-1 overflow-hidden opacity-0",
				!isDndActive && "group-hover/nav:w-auto group-hover/nav:opacity-100",
				"[&:has([data-state=open])]:w-auto [&:has([data-state=open])]:opacity-100",
			)}
		>
			{itemLink ? (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>{moreButton}</DropdownMenuTrigger>
					<DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()} side="right">
						<EditMenu itemLink={currentItemLink} setItemLink={setCurrentItemLink} />
					</DropdownMenuContent>
				</DropdownMenu>
			) : (
				moreButton
			)}
			{onAddChild && (
				<Tooltip>
					<TooltipTrigger asChild>
						<span
							className="hover:bg-sidebar-accent group/add flex size-5 items-center justify-center rounded text-muted-foreground"
							data-testid="create-article"
							onClick={onAddChild}
						>
							<Icon className="group-hover/add:text-primary-fg" icon="plus" />
						</span>
					</TooltipTrigger>
					<TooltipContent focus="high">{t("article.add-child")}</TooltipContent>
				</Tooltip>
			)}
		</span>
	);
};
