import styled from "@emotion/styled";
import { ToolbarIcon, ToolbarToggleButton, ToolbarToggleButtonProps } from "@ui-kit/Toolbar";

interface AiToolbarButtonProps extends Omit<ToolbarToggleButtonProps, "children"> {
	tooltipText: string;
	icon: string;
}

const StyledToolbarToggleButton = styled(ToolbarToggleButton)`
	background-color: hsl(var(--inverse-accent));
	color: hsl(var(--inverse-accent-text));

	> svg {
		color: hsl(var(--inverse-accent-text));
	}

	&:hover {
		background-color: hsl(var(--inverse-accent-hover));
	}
`;

export const AiToolbarButton = ({ tooltipText, icon, ...otherProps }: AiToolbarButtonProps) => {
	return (
		<StyledToolbarToggleButton className="text-secondary-bg" focusable tooltipText={tooltipText} {...otherProps}>
			<ToolbarIcon icon={icon} />
		</StyledToolbarToggleButton>
	);
};
