import t from "@ext/localization/locale/translate";
import type { IconPickerDisableOption } from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPicker";
import { useComponentVariant } from "@ui-kit/hooks/useComponentVariant";
import { ToggleGroup, ToggleGroupItem } from "@ui-kit/ToggleGroup";
import { useMemo } from "react";
import { tv } from "tailwind-variants";

export type IconPickerTab = "icons" | "emoji" | "file-input";

interface IconPickerToggleGroupProps {
	tab: IconPickerTab;
	onTabChange: (tab: IconPickerTab) => void;
	disable?: IconPickerDisableOption;
}

const toggleGroupItemStyles = tv({
	base: [
		"h-7 transition-colors focus:outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
	],
	variants: {
		variant: {
			default: [
				"bg-primary-bg text-primary-fg hover:bg-primary-hover focus:bg-primary-hover",
				"data-[state=on]:bg-secondary-bg-hover data-[state=on]:text-secondary-fg",
				"bg-transparent hover:text-secondary-fg hover:bg-secondary-bg-hover",
				"active:bg-secondary-bg-hover active:text-secondary-fg",
			],
			inverse:
				"hover:bg-inverse-hover focus:bg-inverse-hover data-[state=on]:bg-inverse-hover text-inverse-primary-fg data-[state=on]:text-inverse-primary-fg hover:text-inverse-primary-fg",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

export const IconPickerToggleGroup = (props: IconPickerToggleGroupProps) => {
	const { tab, onTabChange, disable = ["file-input"] } = props;
	const { variant: theme } = useComponentVariant();
	const iconsAllowed = !disable.includes("icons");
	const emojiAllowed = !disable.includes("emoji");
	const fileInputAllowed = !disable.includes("file-input");

	const shouldHideToggleGroup = useMemo(() => {
		const unique = new Set(disable);
		unique.delete("color");
		return unique.size > 1;
	}, [disable]);

	if (shouldHideToggleGroup) return null;

	return (
		<div className="px-1 pt-1 mb-1">
			<ToggleGroup
				className="justify-start"
				onValueChange={onTabChange}
				type="single"
				value={tab}
				variant="default"
			>
				{iconsAllowed && (
					<ToggleGroupItem className={toggleGroupItemStyles({ variant: theme })} value="icons">
						{t("icon-picker.tabs.icons")}
					</ToggleGroupItem>
				)}
				{emojiAllowed && (
					<ToggleGroupItem className={toggleGroupItemStyles({ variant: theme })} value="emoji">
						{t("icon-picker.tabs.emoji")}
					</ToggleGroupItem>
				)}
				{fileInputAllowed && (
					<ToggleGroupItem className={toggleGroupItemStyles({ variant: theme })} value="file-input">
						{t("icon-picker.tabs.file-input")}
					</ToggleGroupItem>
				)}
			</ToggleGroup>
		</div>
	);
};
