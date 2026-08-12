import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import { cn } from "@core-ui/utils/cn";
import { IconPickerHeaderItem } from "@ext/markdown/elements/icon/edit/components/IconPicker/Icon/IconPickerItem";
import { getEmojiCategoryName } from "@ext/markdown/elements/icon/edit/logic/getEmojiCategoryName";
import { Divider } from "@ui-kit/Divider";
import { useComponentVariant } from "@ui-kit/hooks/useComponentVariant";
import { MenuItem } from "@ui-kit/MenuItem";
import { ScrollArea } from "@ui-kit/ScrollArea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { forwardRef } from "react";

interface EmojiPickerFooterProps {
	categoryRepresentatives: Record<string, string | { code: IconCode }>;
	activeCategory: string;
	scrollToCategory: (category: string) => void;
}

export const EmojiPickerFooter = forwardRef<HTMLDivElement, EmojiPickerFooterProps>(
	({ categoryRepresentatives, activeCategory, scrollToCategory }, ref) => {
		const { variant: theme } = useComponentVariant();
		return (
			<>
				<Divider className={cn(theme === "inverse" && "bg-inverse-border", "shrink-0")} />
				<ScrollArea
					className="shrink-0 [&>div:nth-child(3)]:opacity-0 [&>div:nth-child(3)]:pointer-events-none p-1"
					ref={ref}
				>
					<div className="flex items-center gap-1">
						{Object.entries(categoryRepresentatives).map(([category, emoji]) => (
							<Tooltip key={category}>
								<TooltipTrigger asChild>
									{typeof emoji === "string" ? (
										<MenuItem
											className={cn(
												"p-1 inline-flex h-7 w-7 justify-center text-xl",
												theme === "inverse"
													? "data-[selected=true]:bg-inverse-hover"
													: "data-[selected=true]:bg-secondary-bg-hover",
											)}
											data-category={category}
											data-selected={activeCategory === category}
											onClick={() => scrollToCategory(category)}
										>
											{emoji}
										</MenuItem>
									) : (
										<IconPickerHeaderItem
											active={activeCategory === category}
											category={category}
											className="text-xl"
											code={emoji.code}
										/>
									)}
								</TooltipTrigger>
								<TooltipContent>{getEmojiCategoryName(category)}</TooltipContent>
							</Tooltip>
						))}
					</div>
				</ScrollArea>
			</>
		);
	},
);
