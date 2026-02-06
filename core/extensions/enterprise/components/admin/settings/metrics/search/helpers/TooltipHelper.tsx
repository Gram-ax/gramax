import styled from "@emotion/styled";
import { Icon } from "@ui-kit/Icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "ics-ui-kit/components/tooltip";

const StyledIconWrapper = styled.span`
	display: inline-flex;
	cursor: pointer;
	transition: color 0.2s ease;
	
	&:hover {
		color: var(--color-primary);
	}
`;

export const MetricsTooltipHelper = ({ text }: { text: string }) => {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<StyledIconWrapper>
						<Icon className="flex-shrink-0" icon="help-circle" />
					</StyledIconWrapper>
				</TooltipTrigger>
				<TooltipContent>
					<p className="max-w-xs">{text}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
