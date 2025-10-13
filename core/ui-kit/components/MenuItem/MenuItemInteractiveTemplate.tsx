import { Icon } from "@ui-kit/Icon";
import {
	MenuItemText,
	MenuItemInteractiveTemplate as UiKitMenuItemInteractiveTemplate,
} from "ics-ui-kit/components/menu-item";
import { ExtractComponentGeneric } from "../../lib/extractComponentGeneric";
import { Indicator } from "../Indicator";
import { MenuItemIconButton } from "@ui-kit/MenuItem/MenuItemIconButton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@ui-kit/Tooltip";

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
			rounded
			className={`${className} h-1.5 w-1.5 rounded-full absolute m-0.5 bg-status-error left-[2.75rem] top-1`}
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
				<Icon icon="check" className={isSelected ? "visible" : "invisible"} />
				<Icon className="icon" icon={icon} />
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
										icon={buttonIcon}
										onClick={undefined}
										disabled={buttonIcon !== "loader"}
										className={"cursor-not-allowed h-6 w-6"}
									/>
								</span>
							</TooltipTrigger>
							<TooltipContent>{disabledTooltip}</TooltipContent>
						</Tooltip>
					) : (
						<MenuItemIconButton
							icon={buttonIcon}
							onClick={buttonOnClick}
							disabled={false}
							className="h-6 w-6"
						/>
					))}
			</div>
		</div>
	);
};
