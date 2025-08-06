import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { MenuItemRichTemplate as UiKitMenuItemRichTemplate } from "ics-ui-kit/components/menu-item";
import { forwardRef } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitMenuItemRichTemplateProps = ExtractComponentGeneric<typeof UiKitMenuItemRichTemplate>;

export interface MenuItemRichTemplateProps extends Omit<UiKitMenuItemRichTemplateProps, "icon"> {
	icon?: string;
}

export const MenuItemRichTemplate = forwardRef<HTMLButtonElement, MenuItemRichTemplateProps>((props) => {
	const { icon, ...otherProps } = props;
	const Icon = icon && LucideIcon(icon);

	return <UiKitMenuItemRichTemplate icon={Icon as any} {...otherProps} />;
});
