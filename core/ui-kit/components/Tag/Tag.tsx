/** biome-ignore-all lint/suspicious/noExplicitAny: expected */
import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { cn } from "@core-ui/utils/cn";
import type { ExtractComponentGeneric } from "core/ui-kit/lib/extractComponentGeneric";
import { Tag as UiKitTag } from "ics-ui-kit/components/tag";
import { forwardRef } from "react";

type UiKitTagProps = ExtractComponentGeneric<typeof UiKitTag>;

export interface TagProps extends Omit<UiKitTagProps, "startIcon" | "endIcon"> {
	startIcon?: string;
	endIcon?: string;
	containerClassName?: string;
}

export const Tag = forwardRef<HTMLDivElement, TagProps>(
	({ startIcon, endIcon, containerClassName, ...otherProps }, ref) => {
		const StartIcon = startIcon && LucideIcon(startIcon);
		const EndIcon = endIcon && LucideIcon(endIcon);

		return (
			<div className={cn("flex min-w-0 max-w-full w-full", containerClassName)} ref={ref}>
				<UiKitTag
					buttonClassName={cn("min-w-0", otherProps.buttonClassName)}
					endIcon={EndIcon as any}
					startIcon={StartIcon as any}
					{...otherProps}
				/>
			</div>
		);
	},
);
