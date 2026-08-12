import t from "@ext/localization/locale/translate";
import type {
	IconPickerColor as IconPickerColorType,
	IconPickerDisableOption,
} from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPicker";
import { IconPickerColor } from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPickerColor";
import type { IconPickerTab } from "@ext/markdown/elements/icon/edit/components/IconPicker/IconPickerToggleGroup";
import { useComponentVariant } from "@ui-kit/hooks/useComponentVariant";
import { Icon } from "@ui-kit/Icon";
import { TextInput } from "@ui-kit/Input";
import { tv } from "tailwind-variants";

interface IconPickerSearchBarProps {
	value: string;
	onChange: (value: string) => void;
	tab: Exclude<IconPickerTab, "file-input">;
	iconColor: IconPickerColorType;
	setIconColor: (color: IconPickerColorType) => void;
	disable?: IconPickerDisableOption;
}

const textInputStyles = tv({
	base: [
		"min-w-0 !h-7 text-sm w-full hover:!shadow-none focus:!shadow-none",
		"!shadow-none bg-transparent",
		"has-[input:focus]:!bg-transparent",
		"[&>div:first-of-type]:pl-2 w-full",
	],
	variants: {
		variant: {
			default:
				"text-primary-fg has-[input:focus]:border-secondary-border border-secondary-border hover:border-secondary-border",
			inverse:
				"text-inverse-primary-fg has-[input:focus]:border-inverse-border border-inverse-border hover:border-inverse-border",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

export const IconPickerSearchBar = ({
	value,
	onChange,
	tab,
	iconColor,
	setIconColor,
	disable = [],
}: IconPickerSearchBarProps) => {
	const { variant: theme } = useComponentVariant();
	return (
		<div className="flex items-center gap-1 p-1 overflow-hidden">
			<TextInput
				className={textInputStyles({ variant: theme })}
				onChange={onChange}
				placeholder={t(`icon-picker.search.${tab}`)}
				startIcon={<Icon className="text-muted h-3.5 w-3.5" icon="search" />}
				value={value}
			/>
			{tab === "icons" && !disable.includes("color") && (
				<IconPickerColor iconColor={iconColor} setIconColor={setIconColor} />
			)}
		</div>
	);
};
