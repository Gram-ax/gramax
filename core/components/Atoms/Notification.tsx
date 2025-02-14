import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import type { HTMLAttributes } from "react";

type NotificationProps = { tooltip?: string; size?: number } & HTMLAttributes<HTMLDivElement>;

const NotificationWrapper = styled.div<{ size?: number }>`
	font-size: ${({ size }) => size}px;
`;

const Notification = ({ tooltip, className, size = 12, ...props }: NotificationProps) => {
	if (tooltip) {
		return (
			<Tooltip content={tooltip}>
				<NotificationWrapper size={size} className={className}>
					<div {...props} />
				</NotificationWrapper>
			</Tooltip>
		);
	}
	return (
		<NotificationWrapper size={size} className={className}>
			<div {...props} />
		</NotificationWrapper>
	);
};

export default styled(Notification)`
	top: -0.5rem;
	z-index: var(--z-index-base);
	right: -0.5rem;
	height: 1.5em;
	padding: 0 0.2em;
	min-width: 1.5em;
	border-radius: 1rem;
	display: flex;
	color: white;
	background: red;
	user-select: none;
	position: absolute;
	text-align: center;

	& > div {
		width: 100%;
		display: flex;
		line-height: 1;
		text-align: center;
		align-items: center;
		justify-content: center;
	}
`;
