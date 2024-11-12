import Tooltip from "@components/Atoms/Tooltip";
import styled from "@emotion/styled";
import type { HTMLAttributes } from "react";

type NotificationProps = { tooltip?: string } & HTMLAttributes<HTMLDivElement>;

const Notification = ({ tooltip, className, ...props }: NotificationProps) => {
	if (tooltip) {
		return (
			<Tooltip content={tooltip}>
				<div className={className}>
					<div {...props} />
				</div>
			</Tooltip>
		);
	}
	return (
		<div className={className}>
			<div {...props} />
		</div>
	);
};

export default styled(Notification)`
	top: -0.5rem;
	z-index: var(--z-index-base);
	right: -0.5rem;
	height: 1.05rem;
	padding: 0 0.2rem;
	font-size: 0.7rem;
	min-width: 1.05rem;
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
