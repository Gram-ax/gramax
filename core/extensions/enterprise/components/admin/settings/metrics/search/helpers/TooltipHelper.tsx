// biome-ignore lint/style/noRestrictedImports: TODO: fix
import styled from "@emotion/styled";
import { Icon } from "@ui-kit/Icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ui-kit/Tooltip";

const StyledWrapper = styled.span`
	display: inline-flex;
	cursor: pointer;
	transition: color 0.2s ease;
	
	&:hover {
		color: var(--color-primary);
	}
`;

export const MetricsTooltipHelper = ({ label, text }: { label: string; text: string }) => {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<StyledWrapper className="flex gap-1 items-center text-muted">
						{label}
						<Icon className="flex-shrink-0" icon="help-circle" />
					</StyledWrapper>
				</TooltipTrigger>
				<TooltipContent className="font-sans font-normal">
					<p className="max-w-xs">{text}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};
