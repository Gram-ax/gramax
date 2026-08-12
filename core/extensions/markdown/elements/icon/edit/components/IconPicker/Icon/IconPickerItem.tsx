import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import { cn } from "@core-ui/utils/cn";
import type {
	IconPickerColor,
	OnChangeCallback,
} from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPicker";
import IconComponent from "@ext/markdown/elements/icon/render/components/Icon";
import { useComponentVariant } from "@ui-kit/hooks/useComponentVariant";
import { Icon } from "@ui-kit/Icon";
import { MenuItem } from "@ui-kit/MenuItem";
import { forwardRef, type HTMLAttributes, useCallback } from "react";

interface IconPickerItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
	code: IconCode;
	svg?: string;
	onClick?: OnChangeCallback;
	color?: IconPickerColor;
}

interface IconPickerHeaderItemProps extends HTMLAttributes<HTMLDivElement> {
	code: IconCode;
	svg?: string;
	category: string;
	active?: boolean;
}

export const IconPickerItem = forwardRef<HTMLDivElement, IconPickerItemProps>(
	({ code, svg, className, onClick, color, ...props }, ref) => {
		const handleClick = useCallback(() => {
			onClick?.({ code, svg, color });
		}, [code, color, onClick, svg]);

		return (
			<MenuItem
				{...props}
				className={cn("p-1 h-7 w-7 justify-center", className)}
				onClick={handleClick}
				ref={ref}
			>
				{svg ? (
					<IconComponent
						className="shrink-0"
						code={code}
						color={color ? `var(--color-icon-${color})` : undefined}
						svg={svg}
					/>
				) : (
					<Icon
						className="shrink-0 stroke-[1.5]"
						color={color ? `var(--color-icon-${color})` : undefined}
						icon={code}
						size="lg"
					/>
				)}
			</MenuItem>
		);
	},
);

export const IconPickerHeaderItem = forwardRef<HTMLDivElement, IconPickerHeaderItemProps>(
	({ code, svg, category, active, className, ...props }, ref) => {
		const { variant: theme } = useComponentVariant();
		return (
			<MenuItem
				data-category={category}
				data-selected={active}
				{...props}
				className={cn(
					"p-1 inline-flex h-7 w-7 justify-center",
					theme === "inverse"
						? "data-[selected=true]:bg-inverse-hover"
						: "data-[selected=true]:bg-secondary-bg-hover",
					className,
				)}
				ref={ref}
			>
				{svg ? (
					<IconComponent className="shrink-0" code={code} svg={svg} />
				) : (
					<Icon className="shrink-0 stroke-[1.5]" icon={code} size="lg" />
				)}
			</MenuItem>
		);
	},
);
