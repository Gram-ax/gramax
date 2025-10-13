import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { MenuItemIconButton as UiKitMenuItemIconButton } from "ics-ui-kit/components/menu-item";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitMenuItemIconButtonProps = ExtractComponentGeneric<typeof UiKitMenuItemIconButton>;

export interface MenuItemIconButtonProps extends Omit<UiKitMenuItemIconButtonProps, "icon"> {
	icon?: string;
}

export const MenuItemIconButton = ({ icon, ...otherProps }: MenuItemIconButtonProps) => {
	const Icon = icon && LucideIcon(icon);
	if (!Icon) return null;

	return <UiKitMenuItemIconButton icon={Icon as any} {...otherProps} />;
};
