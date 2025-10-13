import { ReactElement, MouseEvent } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@ui-kit/Tooltip";
import { IconButton } from "@ui-kit/Button";
import styled from "@emotion/styled";

interface MediaHeaderButtonProps {
	icon: string;
	tooltipText?: JSX.Element;
	className?: string;
	onClick?: (e: MouseEvent<HTMLElement>) => void;
}

const TooltipElement = ({ content, children }: { content: ReactElement; children: ReactElement }) => {
	return (
		<Tooltip delayDuration={500}>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent>{content}</TooltipContent>
		</Tooltip>
	);
};

const MediaHeaderButtonUnstyled = (props: MediaHeaderButtonProps): ReactElement => {
	const { icon, onClick, tooltipText, className } = props;

	return (
		<TooltipElement content={tooltipText}>
			<IconButton variant="text" icon={icon} onClick={onClick} className={className} />
		</TooltipElement>
	);
};

export const MediaHeaderButton = styled(MediaHeaderButtonUnstyled)`
	color: hsl(var(--inverse-muted));

	&:hover {
		color: hsl(var(--inverse-primary-fg)) !important;
	}

	> i,
	> a > i {
		display: flex;
		cursor: pointer !important;
		transition: 0.25s;
		font-size: var(--big-icon-size);
		color: var(--color-active-white);

		:hover {
			color: var(--color-active-white-hover);
		}
	}
`;
