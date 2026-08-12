import { cn } from "@core-ui/utils/cn";
import type { ButtonProps } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type ComponentProps, forwardRef } from "react";
import { tv, type VariantProps } from "tailwind-variants";

export interface SidebarMenuButtonVariants {
	variant?: "default" | "outline";
	size?: "default" | "sm" | "lg";
}

const sidebarMenuButtonStyles = tv({
	base: [
		"peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-lg p-2 text-left text-sm text-secondary-fg outline-none transition-[width,height,padding]",
		"hover:bg-secondary-bg-hover hover:text-primary-fg focus-visible:shadow-focus",
		"disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
		"data-[active=true]:bg-primary-bg-hover data-[active=true]:font-medium data-[active=true]:text-primary-accent",
		"data-[active=true]:hover:bg-primary-bg-hover data-[active=true]:hover:text-primary-accent",
		"data-[state=open]:hover:bg-secondary-bg-hover data-[state=open]:hover:text-primary-fg",
		"data-[active=true]:data-[state=open]:hover:bg-primary-bg-hover data-[active=true]:data-[state=open]:hover:text-primary-accent",
		"group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate",
		"[&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted [&[data-active=true]>svg]:text-primary-accent",
		"group-data-[collapsible=icon]:[&>svg]:text-secondary-fg group-data-[collapsible=icon]:[&>svg]:hover:text-primary-fg group-data-[collapsible=icon]:[&[data-active=true]>svg]:text-primary-accent",
		"group-has-[[data-sidebar=menu-action]]/menu-item:pr-8",
	],
	variants: {
		variant: {
			default: "hover:bg-secondary-bg-hover hover:text-primary-fg",
			outline:
				"border border-secondary-border bg-primary-bg shadow-soft-sm hover:bg-secondary-bg-hover hover:text-primary-fg",
		},
		size: {
			default: "h-8 text-sm",
			sm: "h-7 text-xs",
			lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
		},
	},
	defaultVariants: {
		variant: "default",
		size: "default",
	},
});

type SidebarMenuButtonProps = ButtonProps &
	VariantProps<typeof sidebarMenuButtonStyles> & {
		isActive?: boolean;
		tooltip?: string | ComponentProps<typeof TooltipContent>;
	};

export const SidebarMenuButton = forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
	({ className, isActive, size, variant, tooltip, ...props }, ref) => {
		const button = (
			<button
				className={cn(sidebarMenuButtonStyles({ variant, size, ...props }), className)}
				data-active={isActive}
				data-sidebar="menu-button"
				data-size={size}
				ref={ref}
				{...props}
			/>
		);

		if (!tooltip) {
			return button;
		}

		const tooltipProps = typeof tooltip === "string" ? { children: tooltip } : tooltip;

		return (
			<Tooltip>
				<TooltipTrigger asChild>{button}</TooltipTrigger>
				<TooltipContent>{tooltipProps.children}</TooltipContent>
			</Tooltip>
		);
	},
);

SidebarMenuButton.displayName = "SidebarMenuButton";
