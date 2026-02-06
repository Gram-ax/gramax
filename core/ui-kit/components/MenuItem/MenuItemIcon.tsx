import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { MenuItemIcon as UiKitMenuItemIcon } from "ics-ui-kit/components/menu-item";
import { FC } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitMenuItemIconProps = ExtractComponentGeneric<typeof UiKitMenuItemIcon>;

interface MenuItemIconProps extends Omit<UiKitMenuItemIconProps, "icon"> {
	icon?: string;
}

export const MenuItemIcon: FC<MenuItemIconProps> = (props) => {
	const { icon, ...otherProps } = props;
	const Icon = icon && LucideIcon(icon);
	return <UiKitMenuItemIcon {...otherProps} icon={Icon as any} />;
};
