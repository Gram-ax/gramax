import { MenuItemActionTemplate as UiKitMenuItemActionTemplate } from "ics-ui-kit/components/menu-item";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import LucideIcon from "@components/Atoms/Icon/LucideIcon";

type UiKitMenuItemActionTemplateProps = ExtractComponentGeneric<typeof UiKitMenuItemActionTemplate>;

interface MenuItemActionProps extends Omit<UiKitMenuItemActionTemplateProps, "icon"> {
	icon?: string;
}

export const MenuItemAction = (props: MenuItemActionProps) => {
	const { icon, ...otherProps } = props;
	const Icon = icon ? LucideIcon(icon) : null;

	return <UiKitMenuItemActionTemplate {...otherProps} icon={Icon as any} />;
};
