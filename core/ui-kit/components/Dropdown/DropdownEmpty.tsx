import { cn } from "@core-ui/utils/cn";
import { useComponentVariant } from "ics-ui-kit/providers/component-variant-context";
import type { ReactNode } from "react";

interface DropdownEmptyProps {
	children?: ReactNode;
	className?: string;
}

export const DropdownEmpty = ({ children, className }: DropdownEmptyProps) => {
	const { variant: theme } = useComponentVariant();
	const isInverse = theme === "inverse";

	return (
		<div
			className={cn(
				"py-6 text-center text-sm",
				isInverse ? "text-inverse-muted" : "text-muted-foreground",
				className,
			)}
		>
			{children}
		</div>
	);
};
