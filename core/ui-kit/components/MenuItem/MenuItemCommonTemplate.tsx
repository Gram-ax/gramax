import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { MenuItemCommonTemplate as UiKitMenuItemCommonTemplate } from "ics-ui-kit/components/menu-item";
import { forwardRef } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitMenuItemCommonTemplateProps = ExtractComponentGeneric<typeof UiKitMenuItemCommonTemplate>;

export interface MenuItemCommonTemplateProps extends Omit<UiKitMenuItemCommonTemplateProps, "icon"> {
	icon?: string;
}

export const MenuItemCommonTemplate = forwardRef<HTMLButtonElement, MenuItemCommonTemplateProps>((props) => {
	const { icon, ...otherProps } = props;
	const Icon = icon && LucideIcon(icon);

	return <UiKitMenuItemCommonTemplate icon={Icon as any} {...otherProps} />;
});
