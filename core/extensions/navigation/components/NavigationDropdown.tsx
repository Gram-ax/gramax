import t from "@ext/localization/locale/translate";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@ui-kit/Dropdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { CSSProperties, FC } from "react";

interface NavigationDropdownProps {
	children: React.ReactNode;
	trigger: React.ReactNode;
	style?: CSSProperties;
	className?: string;
	dataQa?: string;
	onOpen?: () => void;
	onClose?: () => void;
}

const NavigationDropdown: FC<NavigationDropdownProps> = (props) => {
	const { children, onOpen, onClose, style, className, trigger, dataQa } = props;

	const handleOpenChange = (open: boolean) => {
		if (open) onOpen?.();
		else onClose?.();
	};

	return (
		<DropdownMenu onOpenChange={handleOpenChange}>
			<DropdownMenuTrigger asChild>
				<div style={style} className={className} data-qa={dataQa}>
					<Tooltip>
						<TooltipContent>{t("actions")}</TooltipContent>
						<TooltipTrigger asChild>{trigger}</TooltipTrigger>
					</Tooltip>
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" style={{ minHeight: "fit-content" }}>
				{children}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default NavigationDropdown;
