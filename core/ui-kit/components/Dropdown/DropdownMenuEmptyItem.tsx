import { cn } from "@core-ui/utils/cn";
import { useComponentVariant } from "ics-ui-kit/providers/component-variant-context";
import type { HTMLAttributes } from "react";

type DropdownMenuEmptyItemProps = HTMLAttributes<HTMLDivElement>;

export const DropdownMenuEmptyItem = ({ children, className, ...props }: DropdownMenuEmptyItemProps) => {
	const { variant: theme } = useComponentVariant();
	const isInverse = theme === "inverse";

	return (
		<div
			className={cn(
				"py-6 text-center text-sm",
				isInverse ? "text-inverse-muted" : "text-muted-foreground",
				className,
			)}
			data-dropdown-menu-empty-item
			data-testid="dropdown-menu-empty-item"
			{...props}
		>
			{children}
		</div>
	);
};
