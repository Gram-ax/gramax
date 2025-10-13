import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { MenuItemRichTemplate as UiKitMenuItemRichTemplate } from "ics-ui-kit/components/menu-item";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitMenuItemRichTemplateProps = ExtractComponentGeneric<typeof UiKitMenuItemRichTemplate>;

export interface MenuItemRichTemplateProps extends Omit<UiKitMenuItemRichTemplateProps, "icon"> {
	icon?: string;
}

export const MenuItemRichTemplate = ({ icon, ...otherProps }: MenuItemRichTemplateProps) => {
	const Icon = icon && LucideIcon(icon);

	return <UiKitMenuItemRichTemplate icon={Icon as any} {...otherProps} />;
};
