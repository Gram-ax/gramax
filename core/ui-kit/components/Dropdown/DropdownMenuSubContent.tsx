import { cn } from "@core-ui/utils/cn";
import { DropdownMenuSubContent as UiKitDropdownMenuSubContent } from "ics-ui-kit/components/dropdown";
import { type FC, forwardRef } from "react";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

interface UiKitDropdownMenuSubContentProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuSubContent> {}

export const DropdownMenuSubContent: FC<UiKitDropdownMenuSubContentProps> = forwardRef(
	({ className, ...props }, ref) => {
		return (
			<UiKitDropdownMenuSubContent
				{...props}
				className={cn(
					"max-h-[var(--radix-dropdown-menu-content-available-height)] !overflow-y-auto",
					className,
				)}
				data-dropdown-menu-sub-content
				data-qa="dropdown-menu-content"
				data-testid="sub-content"
				ref={ref}
			/>
		);
	},
);
