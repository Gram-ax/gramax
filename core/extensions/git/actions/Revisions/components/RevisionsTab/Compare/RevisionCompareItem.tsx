import { IconButton } from "@ui-kit/Button";
import type { HTMLAttributes, MouseEvent, ReactNode } from "react";
import { tv } from "tailwind-variants";

export type RevisionCommit = "A" | "B";

export type RevisionVariant = "green" | "yellow";

interface RevisionCompareItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
	title: ReactNode;
	circle: RevisionCommit;
	selected?: boolean;
	variant: RevisionVariant;
	onClearClick?: (e: MouseEvent) => void;
}

const styles = tv({
	slots: {
		root: "flex items-center gap-2 p-2.5 py-2 rounded-lg border overflow-hidden h-12",
		title: "text-xs font-normal flex-1 min-w-0",
		circle: "h-6 w-6 flex items-center justify-center text-xs text-muted font-semibold rounded-full shrink-0 border bg-secondary-bg",
	},
	defaultVariants: {
		variant: "green",
		selected: false,
	},
	variants: {
		selected: {
			true: "",
		},
		variant: {
			green: "",
			yellow: "",
		},
	},
	compoundSlots: [
		{
			slots: ["root", "circle"],
			variant: "green",
			class: "border-status-success-primary-border text-status-success-fg",
		},
		{
			slots: ["root", "circle"],
			variant: "yellow",
			class: "border-status-warning-primary-border text-status-warning-fg",
		},
		{
			slots: ["root"],
			variant: "green",
			class: "bg-status-success-bg",
		},
		{
			slots: ["root"],
			variant: "yellow",
			class: "bg-status-warning-bg",
		},
		{
			slots: ["root", "circle"],
			selected: true,
			class: "border",
		},
		{
			slots: ["root", "circle"],
			selected: false,
			class: "border-dashed",
		},
	],
});

export const RevisionCompareBlankItem = (props: Omit<RevisionCompareItemProps, "onClearClick">) => {
	const { title, circle, variant = "green", selected = false, ...rest } = props;
	const { title: titleStyle, circle: circleStyle, root: rootStyle } = styles({ variant, selected });
	return (
		<div className={rootStyle()} {...rest}>
			<div className={circleStyle()}>{circle}</div>
			<div className={titleStyle()}>{title}</div>
		</div>
	);
};

export const RevisionCompareItem = (props: RevisionCompareItemProps) => {
	const { title, circle, variant = "green", selected = false, onClearClick, ...rest } = props;
	const { title: titleStyle, circle: circleStyle, root: rootStyle } = styles({ variant, selected });
	return (
		<div className={rootStyle()} {...rest}>
			<div className={circleStyle()}>{circle}</div>
			<div className={titleStyle()}>{title}</div>
			{onClearClick && (
				<IconButton className="h-auto p-0" icon="x" onClick={onClearClick} size="sm" variant="text" />
			)}
		</div>
	);
};
