import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { MenuItemCommonTemplate as UiKitMenuItemCommonTemplate } from "ics-ui-kit/components/menu-item";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitMenuItemCommonTemplateProps = ExtractComponentGeneric<typeof UiKitMenuItemCommonTemplate>;

export interface MenuItemCommonTemplateProps extends Omit<UiKitMenuItemCommonTemplateProps, "icon"> {
	icon?: string;
}

export const MenuItemCommonTemplate = ({ icon, ...otherProps }: MenuItemCommonTemplateProps) => {
	const Icon = icon && LucideIcon(icon);

	return <UiKitMenuItemCommonTemplate icon={Icon as any} {...otherProps} />;
};
