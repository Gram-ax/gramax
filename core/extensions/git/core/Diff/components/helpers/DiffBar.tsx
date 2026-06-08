import { cn } from "@core-ui/utils/cn";
import type { HTMLAttributes } from "react";
import { tv } from "tailwind-variants";

type DiffBarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface DiffBarProps extends HTMLAttributes<HTMLDivElement> {
	added: number;
	deleted: number;
	segments?: number;
	size?: DiffBarSize;
}

const barVariants = tv({
	base: "flex overflow-hidden rounded-full w-full",
	variants: {
		size: {
			xs: "h-0.5",
			sm: "h-1",
			md: "h-1.5",
			lg: "h-1.5",
			xl: "h-2",
		},
	},
	defaultVariants: {
		size: "sm",
	},
});

export const DiffBar = (props: DiffBarProps) => {
	const { added, deleted, segments: _segments, size = "sm", className, ...rest } = props;

	const total = added + deleted;
	const addedPct = total === 0 ? 50 : (added / total) * 100;
	const deletedPct = total === 0 ? 50 : (deleted / total) * 100;

	const hasDeleted = deleted > 0;
	const hasAdded = added > 0;

	return (
		<div className={cn(barVariants({ size }), className)} {...rest}>
			{hasAdded && (
				<span
					className={cn("bg-[var(--color-status-new)]", hasDeleted ? "rounded-l-full" : "rounded-full")}
					style={{ width: `${addedPct}%` }}
				/>
			)}
			{hasDeleted && (
				<span
					className={cn("bg-[var(--color-status-deleted)]", hasAdded ? "rounded-r-full" : "rounded-full")}
					style={{ width: `${deletedPct}%` }}
				/>
			)}
			{total === 0 && <span className="w-full bg-[var(--color-status-new)]" />}
		</div>
	);
};
