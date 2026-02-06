import isMobileService from "@core-ui/ContextServices/isMobileService";
import { TitleItem, useFetchArticleHeaders } from "@core-ui/ContextServices/LinkTitleTooltip";
import LinkItem from "@ext/article/LinkCreator/models/LinkItem";
import t from "@ext/localization/locale/translate";
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
	useHoverDropdown,
} from "@ui-kit/Dropdown";
import { Loader } from "@ui-kit/Loader";
import { MenuItemIconButton } from "@ui-kit/MenuItem";
import { ToolbarDropdownMenuContent } from "@ui-kit/Toolbar";
import { useCallback, useEffect } from "react";

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
		<div className="ml-auto" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
			<DropdownMenu modal={isMobile} onOpenChange={onOpenChange} open={isOpen}>
				<DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
					<div>
						<MenuItemIconButton className="w-5 h-5" icon="chevron-right" size="xs" />
					</div>
				</DropdownMenuTrigger>
				<ToolbarDropdownMenuContent
					align="start"
					className="p-2 px-3 -mt-2 cursor-default"
					contentClassName="lg:shadow-hard-base"
					onClick={(event) => event.stopPropagation()}
					side="right"
					style={{ maxHeight: "20rem", overflowY: "auto" }}
				>
					<DropdownMenuLabel className="text-xs font-normal text-inverse-muted">
						{t("article-titles")}
					</DropdownMenuLabel>
					{!headers.length && (
						<DropdownMenuItem className="text-xs" disabled>
							{t("article.links.no-links")}
						</DropdownMenuItem>
					)}
					{!isLoading &&
						headers.map((header) => (
							<DropdownMenuItem
								className="text-xs"
								key={header.url}
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
