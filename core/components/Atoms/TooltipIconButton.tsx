import { IconButton, type IconButtonProps } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

export interface TooltipIconButtonProps extends IconButtonProps {
	tooltip: string;
}

export const TooltipIconButton = (props: TooltipIconButtonProps) => {
	const { tooltip, ...otherProps } = props;
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<IconButton {...otherProps} />
			</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	);
};
