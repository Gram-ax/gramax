import { Icon } from "@ui-kit/Icon";
import { MenuItemIconButton } from "@ui-kit/MenuItem/MenuItemIconButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import {
	MenuItemText,
	type MenuItemInteractiveTemplate as UiKitMenuItemInteractiveTemplate,
} from "ics-ui-kit/components/menu-item";
import type { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { Indicator } from "../Indicator";

type UiKitMenuItemInteractiveTemplateProps = ExtractComponentGeneric<typeof UiKitMenuItemInteractiveTemplate>;

export interface MenuItemInteractiveTemplateProps
	extends Omit<UiKitMenuItemInteractiveTemplateProps, "icon" | "buttonIcon"> {
	icon?: string;
	buttonIcon?: string;
	buttonDisabled?: boolean;
	disabledTooltip?: string;
	indicator?: boolean;
	indicatorClassName?: string;
	indicatorTooltip?: string;
}

const IndicatorComponent = (props: { className?: string; tooltip?: string }) => {
	const { className, tooltip } = props;

	const IndicatorComponent = (
		<Indicator
			className={`${className} h-1.5 w-1.5 rounded-full absolute m-0.5 bg-status-error left-[2.75rem] top-1`}
			rounded
		/>
	);

	if (tooltip) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>{IndicatorComponent}</TooltipTrigger>
				<TooltipContent>{tooltip}</TooltipContent>
			</Tooltip>
		);
	}

	return IndicatorComponent;
};

export const MenuItemInteractiveTemplate = (props: MenuItemInteractiveTemplateProps) => {
	const {
		icon,
		buttonIcon,
		isSelected,
		text,
		buttonOnClick,
		buttonDisabled,
		disabledTooltip,
		indicator,
		indicatorClassName,
		indicatorTooltip,
	} = props;

	return (
		<div className="flex flex-row items-center justify-between w-full" style={{ gap: "0.75rem" }}>
			<div className="flex flex-row items-center w-full" style={{ gap: "0.5rem" }}>
				<Icon className={isSelected ? "visible" : "invisible"} icon="check" />
				<Icon className="icon" icon={icon || "layers"} />
				{indicator && <IndicatorComponent className={indicatorClassName} tooltip={indicatorTooltip} />}
				<MenuItemText>{text} </MenuItemText>
			</div>
			<div>
				{buttonIcon &&
					(buttonDisabled ? (
						<Tooltip>
							<TooltipTrigger asChild>
								<span className="inline-flex">
									<MenuItemIconButton
										className={"cursor-not-allowed h-6 w-6"}
										disabled={buttonIcon !== "loader"}
										icon={buttonIcon}
										onClick={undefined}
									/>
								</span>
							</TooltipTrigger>
							<TooltipContent>{disabledTooltip}</TooltipContent>
						</Tooltip>
					) : (
						<MenuItemIconButton
							className="h-6 w-6"
							disabled={false}
							icon={buttonIcon}
							onClick={buttonOnClick}
						/>
					))}
			</div>
		</div>
	);
};
