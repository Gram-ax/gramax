import { DropdownMenuItem as UiKitDropdownMenuItem } from "ics-ui-kit/components/dropdown";
import type { FC } from "react";
import { tv } from "tailwind-variants";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type DropdownMenuItemType = "default" | "danger";

interface UiKitDropdownMenuItemProps extends ExtractComponentGeneric<typeof UiKitDropdownMenuItem> {
	type?: DropdownMenuItemType;
}

const dropdownMenuItemVariants = tv({
	variants: {
		type: {
			default: "",
			danger: "hover:text-status-error-hover",
		},
	},
});

export const DropdownMenuItem: FC<UiKitDropdownMenuItemProps> = ({ type, className, ...props }) => {
	return (
		<UiKitDropdownMenuItem
			{...props}
			className={dropdownMenuItemVariants({ type, className })}
			data-dropdown-item-type={type}
			data-dropdown-menu-item
			data-qa="qa-clickable"
			data-testid="dropdown-item"
		/>
	);
};
