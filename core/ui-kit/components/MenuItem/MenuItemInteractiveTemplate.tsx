import Icon from "@components/Atoms/Icon";
import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import {
	MenuItemIconButton,
	MenuItemText,
	MenuItemInteractiveTemplate as UiKitMenuItemInteractiveTemplate,
} from "ics-ui-kit/components/menu-item";
import { forwardRef } from "react";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import Tooltip from "@components/Atoms/Tooltip";

type UiKitMenuItemInteractiveTemplateProps = ExtractComponentGeneric<typeof UiKitMenuItemInteractiveTemplate>;

export interface MenuItemInteractiveTemplateProps
	extends Omit<UiKitMenuItemInteractiveTemplateProps, "icon" | "buttonIcon"> {
	icon?: string;
	buttonIcon?: string;
	buttonDisabled?: boolean;
	disabledTooltip?: string;
}

export const MenuItemInteractiveTemplate = forwardRef<HTMLButtonElement, MenuItemInteractiveTemplateProps>((props) => {
	const { icon, buttonIcon, isSelected, text, buttonOnClick, buttonDisabled, disabledTooltip } = props;
	const ButtonIcon = buttonIcon && LucideIcon(buttonIcon);
	
	return (
		<>
			<Icon code="check" className={isSelected ? "visible" : "invisible"} />
			<Icon className="icon" code={icon} />
			<MenuItemText>{text} </MenuItemText>
			{buttonIcon &&
				(buttonDisabled ? (
					<Tooltip content={disabledTooltip}>
						<span className="inline-flex">
							<MenuItemIconButton
								icon={ButtonIcon as any}
								onClick={undefined}
								disabled
								className="opacity-75 cursor-not-allowed"
							/>
						</span>
					</Tooltip>
				) : (
					<MenuItemIconButton icon={ButtonIcon as any} onClick={buttonOnClick} disabled={false} />
				))}
		</>
	);
});
