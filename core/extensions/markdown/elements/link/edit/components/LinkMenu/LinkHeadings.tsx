import { useFetchArticleHeaders, TitleItem } from "@core-ui/ContextServices/LinkTitleTooltip";
import LinkItem from "@ext/article/LinkCreator/models/LinkItem";
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	useHoverDropdown,
} from "@ui-kit/Dropdown";
import t from "@ext/localization/locale/translate";
import { useCallback, useEffect } from "react";
import { Loader } from "@ui-kit/Loader";
import { MenuItemIconButton } from "@ui-kit/MenuItem";
import isMobileService from "@core-ui/ContextServices/isMobileService";
import { ToolbarDropdownMenuContent } from "@ui-kit/Toolbar";

interface LinkHeadingsProps {
	linkItem: LinkItem;
	onUpdate?: (relativePath: string, href: string) => void;
}

export const LinkHeadings = ({ linkItem, onUpdate }: LinkHeadingsProps) => {
	const { isLoading, headers, fetchArticleHeaders } = useFetchArticleHeaders({ linkItem });
	const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown();
	const isMobile = isMobileService.value;

	useEffect(() => {
		if (!isOpen) return;
		void fetchArticleHeaders();
	}, [isOpen, linkItem?.relativePath]);

	const handleHeaderClick = useCallback(
		(header: TitleItem) => {
			if (!onUpdate) return;

			const relativePath = linkItem.relativePath + header.url;
			const href = linkItem.pathname + header.url;

			onUpdate(relativePath, href);
		},
		[linkItem, onUpdate],
	);

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!isMobile) return;
			setIsOpen(open);
		},
		[isMobile],
	);

	return (
		<div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="ml-auto">
			<DropdownMenu open={isOpen} onOpenChange={onOpenChange} modal={isMobile}>
				<DropdownMenuTrigger onClick={(e) => e.stopPropagation()} asChild>
					<div>
						<MenuItemIconButton icon="chevron-right" size="xs" className="w-5 h-5" />
					</div>
				</DropdownMenuTrigger>
				<ToolbarDropdownMenuContent
					align="start"
					side="right"
					contentClassName="lg:shadow-hard-base"
					className="p-2 px-3 -mt-2 cursor-default"
					onClick={(event) => event.stopPropagation()}
					style={{ maxHeight: "20rem", overflowY: "auto" }}
				>
					<DropdownMenuLabel className="text-xs font-normal text-inverse-muted">
						{t("article-titles")}
					</DropdownMenuLabel>
					{!headers.length && (
						<DropdownMenuItem disabled className="text-xs">
							{t("article.links.no-links")}
						</DropdownMenuItem>
					)}
					{!isLoading &&
						headers.map((header) => (
							<DropdownMenuItem
								key={header.url}
								className="text-xs"
								onSelect={() => handleHeaderClick(header)}
							>
								<span>{header.title}</span>
							</DropdownMenuItem>
						))}
					{isLoading && (
						<DropdownMenuItem className="text-xs">
							<Loader size="xs" />
							{t("loading")}
						</DropdownMenuItem>
					)}
				</ToolbarDropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};
