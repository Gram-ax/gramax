import type { HTMLAttributes } from "react";
import { tv } from "tailwind-variants";
import type { RevisionCommit } from "../Compare/RevisionCompareItem";

interface RevisionBadgeProps extends HTMLAttributes<HTMLDivElement> {
	revision: RevisionCommit;
}

const revisionBadgeVariants = tv({
	base: "h-4 w-4 flex items-center justify-center text-xs font-semibold rounded-sm shrink-0 border bg-secondary-bg",
	variants: {
		revision: {
			A: "border-status-warning-primary-border text-status-warning-fg",
			B: "border-status-success-primary-border text-status-success-fg",
		},
	},
});

export const RevisionBadge = ({ revision, className, ...props }: RevisionBadgeProps) => {
	return (
		<div className={revisionBadgeVariants({ revision, className })} {...props}>
			{revision}
		</div>
	);
};
