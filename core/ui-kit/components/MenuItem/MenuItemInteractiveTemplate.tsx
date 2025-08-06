import Icon from "@components/Atoms/Icon";
import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import {
	MenuItemIconButton,
	MenuItemText,
	MenuItemInteractiveTemplate as UiKitMenuItemInteractiveTemplate,
} from "ics-ui-kit/components/menu-item";
import { forwardRef } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";

type UiKitMenuItemInteractiveTemplateProps = ExtractComponentGeneric<typeof UiKitMenuItemInteractiveTemplate>;

export interface MenuItemInteractiveTemplateProps
	extends Omit<UiKitMenuItemInteractiveTemplateProps, "icon" | "buttonIcon"> {
	icon?: string;
	buttonIcon?: string;
}

export const MenuItemInteractiveTemplate = forwardRef<HTMLButtonElement, MenuItemInteractiveTemplateProps>((props) => {
	const { icon, buttonIcon, isSelected, text, buttonOnClick } = props;
	const ButtonIcon = buttonIcon && LucideIcon(buttonIcon);

	return (
		<>
			<Icon code="check" className={isSelected ? "visible" : "invisible"} />
			<Icon className="icon" code={icon} />
			<MenuItemText>{text} </MenuItemText>
			{buttonIcon && <MenuItemIconButton icon={ButtonIcon as any} onClick={buttonOnClick} />}
		</>
	);
});
