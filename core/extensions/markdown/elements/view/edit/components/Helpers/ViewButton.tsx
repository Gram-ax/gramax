import ActionButton from "@components/controls/HoverController/ActionButton";
import t from "@ext/localization/locale/translate";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { ReactNode } from "react";

export interface ViewButtonProps {
	icon: string;
	children: ReactNode;
	tooltipText: string;
	disabled?: boolean;
	empty?: boolean;
}

const ViewButton = ({ icon, disabled = false, children, tooltipText, empty = false }: ViewButtonProps) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild disabled={disabled}>
				<div>
					<ActionButton icon={icon} tooltipText={tooltipText} disabled={disabled} />
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuLabel>{tooltipText}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{empty && <DropdownMenuItem disabled>{t("properties.no-values")}</DropdownMenuItem>}
				{children}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default ViewButton;
