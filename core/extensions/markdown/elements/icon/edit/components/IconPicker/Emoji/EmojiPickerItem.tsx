import { cn } from "@core-ui/utils/cn";
import { MenuItem } from "@ui-kit/MenuItem";
import { forwardRef, type HTMLAttributes, useCallback } from "react";

interface EmojiPickerItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
	emoji: string;
	onClick?: (emoji: string) => void;
}

export const EmojiPickerItem = forwardRef<HTMLDivElement, EmojiPickerItemProps>(
	({ emoji, className, onClick, ...props }, ref) => {
		const handleClick = useCallback(() => {
			onClick?.(emoji);
		}, [emoji, onClick]);

		return (
			<MenuItem
				{...props}
				className={cn("p-1 h-7 w-7 justify-center leading-none text-xl", className)}
				onClick={handleClick}
				ref={ref}
			>
				{emoji}
			</MenuItem>
		);
	},
);
