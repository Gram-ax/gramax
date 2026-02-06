import t from "@ext/localization/locale/translate";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import type { CSSProperties, FC } from "react";

interface NavigationDropdownProps {
	children: React.ReactNode;
	trigger: React.ReactNode;
	tooltipText?: string;
	style?: CSSProperties;
	className?: string;
	dataQa?: string;
	dataTestId?: string;
	onOpen?: () => void;
	onClose?: () => void;
}

const NavigationDropdown: FC<NavigationDropdownProps> = (props) => {
	const { children, onOpen, onClose, style, className, trigger, dataQa, dataTestId, tooltipText } = props;

	const handleOpenChange = (open: boolean) => {
		if (open) onOpen?.();
		else onClose?.();
	};

	return (
		<DropdownMenu onOpenChange={handleOpenChange}>
			<DropdownMenuTrigger asChild>
				<div className={className} data-qa={dataQa} data-testid={dataTestId} style={style}>
					<Tooltip>
						<TooltipContent>{tooltipText ?? t("actions")}</TooltipContent>
						<TooltipTrigger asChild>{trigger}</TooltipTrigger>
					</Tooltip>
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">{children}</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default NavigationDropdown;
