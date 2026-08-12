import { cn } from "@core-ui/utils/cn";
import { IconPickerHeaderItem } from "@ext/markdown/elements/icon/edit/components/IconPicker/Icon/IconPickerItem";
import { getIconPickerCategoryName } from "@ext/markdown/elements/icon/edit/logic/getIconPickerCategoryName";
import type { CategoryWithIcon } from "@ext/markdown/elements/icon/logic/hooks/useIconPicker";
import { Divider } from "@ui-kit/Divider";
import { useComponentVariant } from "@ui-kit/hooks/useComponentVariant";
import { ScrollArea } from "@ui-kit/ScrollArea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { forwardRef } from "react";

interface IconPickerFooterProps {
	categories: CategoryWithIcon;
	activeCategory: string;
	scrollToCategory: (category: string) => void;
}

export const IconPickerFooter = forwardRef<HTMLDivElement, IconPickerFooterProps>(
	({ categories, activeCategory, scrollToCategory }, ref) => {
		const { variant: theme } = useComponentVariant();
		return (
			<>
				<Divider className={cn(theme === "inverse" && "bg-inverse-border", "shrink-0")} />
				<ScrollArea
					className="shrink-0 [&>div:nth-child(3)]:opacity-0 [&>div:nth-child(3)]:pointer-events-none p-1"
					ref={ref}
				>
					<div className="flex items-center gap-1">
						{Object.entries(categories).map(([category, { code, svg }]) => (
							<Tooltip key={category}>
								<TooltipTrigger asChild>
									<IconPickerHeaderItem
										active={activeCategory === category}
										category={category}
										code={code}
										onClick={() => scrollToCategory(category)}
										svg={svg}
									/>
								</TooltipTrigger>
								<TooltipContent>{getIconPickerCategoryName(category)}</TooltipContent>
							</Tooltip>
						))}
					</div>
				</ScrollArea>
			</>
		);
	},
);
