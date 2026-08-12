import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import type { ReactNode } from "react";

interface WithTooltipProps {
	tooltip?: ReactNode;
	children: ReactNode;
	className?: string;
}

export const WithTooltip = ({ tooltip, children, className }: WithTooltipProps) => {
	if (!tooltip) return <>{children}</>;
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className={className}>{children}</span>
			</TooltipTrigger>
			<TooltipContent className="font-sans font-normal">{tooltip}</TooltipContent>
		</Tooltip>
	);
};
