import { cn } from "@core-ui/utils/cn";
import { Icon } from "@ui-kit/Icon";
import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";

const spinnerVariants = cva("flex-col items-center justify-center", {
	variants: { show: { true: "flex", false: "hidden" } },
	defaultVariants: { show: true },
});

const loaderVariants = cva("animate-spin text-primary", {
	variants: { size: { small: "size-6", medium: "size-8", large: "size-12", xl: "size-32" } },
	defaultVariants: { size: "medium" },
});

interface SpinnerContentProps extends VariantProps<typeof spinnerVariants>, VariantProps<typeof loaderVariants> {
	className?: string;
	children?: React.ReactNode;
}

export function Spinner({ size, show, children, className }: SpinnerContentProps) {
	return (
		<span className={spinnerVariants({ show })}>
			<Icon className={cn(loaderVariants({ size }), className)} icon="loader-circle" />
			{children}
		</span>
	);
}
