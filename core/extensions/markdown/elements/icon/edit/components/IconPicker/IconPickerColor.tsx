import { cn } from "@core-ui/utils/cn";
import { HIGHLIGHT_COLOR_NAMES } from "@ext/markdown/elements/highlight/edit/model/consts";
import type { IconPickerColor as IconPickerColorType } from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPicker";
import { ColorTile } from "@ui-kit/ColorTile";
import { useComponentVariant } from "@ui-kit/hooks/useComponentVariant";
import { Icon } from "@ui-kit/Icon";
import { Popover, PopoverContent, PopoverTriggerButton } from "@ui-kit/Popover";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { useCallback } from "react";
import { tv } from "tailwind-variants";

interface IconPickerColorProps {
	iconColor: IconPickerColorType;
	setIconColor: (color: IconPickerColorType) => void;
}

const markerStyles = tv({
	base: "",
	variants: {
		theme: {
			default: "text-inverse-primary-fg",
			inverse: "text-primary-fg",
		},
		color: {
			yellow: "[&>path:last-child]:fill-[var(--color-icon-yellow)]",
			green: "[&>path:last-child]:fill-[var(--color-icon-green)]",
			purple: "[&>path:last-child]:fill-[var(--color-icon-purple)]",
			blue: "[&>path:last-child]:fill-[var(--color-icon-blue)]",
			orange: "[&>path:last-child]:fill-[var(--color-icon-orange)]",
			red: "[&>path:last-child]:fill-[var(--color-icon-red)]",
		},
	},
});

const colorTileStyles = tv({
	variants: {
		color: {
			yellow: "bg-[var(--color-icon-yellow)]",
			green: "bg-[var(--color-icon-green)]",
			purple: "bg-[var(--color-icon-purple)]",
			blue: "bg-[var(--color-icon-blue)]",
			orange: "bg-[var(--color-icon-orange)]",
			red: "bg-[var(--color-icon-red)]",
		},
	},
});

const popoverContentStyles = tv({
	base: "p-0 w-auto rounded-xl overflow-hidden",
	variants: {
		theme: {
			default: "bg-primary-bg border-secondary-border",
			inverse: "border-inverse-border bg-inverse-primary-bg",
		},
	},
	defaultVariants: {
		theme: "default",
	},
});

export const IconPickerColor = ({ iconColor, setIconColor }: IconPickerColorProps) => {
	const { variant: theme } = useComponentVariant();

	const onClickHandler = useCallback(
		(color: IconPickerColorType) => {
			if (!color || color === iconColor) {
				setIconColor(null);
				return;
			}

			setIconColor(color);
		},
		[setIconColor, iconColor],
	);

	return (
		<ComponentVariantProvider variant={theme}>
			<Popover>
				<PopoverTriggerButton
					className={cn("shrink-0 justify-center w-7 h-7 p-0 font-normal", theme !== "inverse" && "dark")}
					size="sm"
					variant="outline"
				>
					<Icon className={markerStyles({ theme, color: iconColor })} icon="color-highlighter" />
				</PopoverTriggerButton>
				<PopoverContent className={popoverContentStyles({ theme })} side="top">
					<div className="flex items-center gap-1 p-1.5 justify-center">
						<ColorTile
							className={cn(theme === "inverse" ? "bg-primary-bg" : "bg-transparent")}
							onClick={() => onClickHandler(null)}
							selected={iconColor === null}
						/>
						{Object.values(HIGHLIGHT_COLOR_NAMES).map((color) => (
							<ColorTile
								className={colorTileStyles({ color })}
								color={color}
								key={color}
								onClick={() => onClickHandler(color)}
								selected={iconColor === color}
							/>
						))}
					</div>
				</PopoverContent>
			</Popover>
		</ComponentVariantProvider>
	);
};
