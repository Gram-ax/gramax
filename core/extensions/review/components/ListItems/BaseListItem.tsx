import { cn } from "@core-ui/utils/cn";
import { MenuItem } from "@ui-kit/MenuItem";
import type { HTMLAttributes } from "react";

export interface BaseListItemProps extends HTMLAttributes<HTMLDivElement> {
	accentClassName?: string;
}

export const BaseListItem = ({ children, accentClassName, className, ...props }: BaseListItemProps) => {
	return (
		<MenuItem
			className={cn(
				"relative flex w-full flex-col gap-1.5 rounded-none px-3 py-2.5 bg-transparent",
				accentClassName,
				className,
			)}
			{...props}
		>
			{children}
		</MenuItem>
	);
};
