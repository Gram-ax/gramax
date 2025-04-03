import styled from "@emotion/styled";
import { CSSProperties, ReactNode } from "react";

interface ItemWrapperProps {
	children: ReactNode;
	text?: ReactNode;
	rightActions?: ReactNode;
	width?: string;
	style?: CSSProperties;
	className?: string;
}

const ItemWrapper = ({ children, text, rightActions, className, style }: ItemWrapperProps) => {
	return (
		<div className={className} style={style}>
			{children}
			<div className="right-extensions">
				{text}
				<div className="right-actions">{rightActions}</div>
			</div>
		</div>
	);
};

export default styled(ItemWrapper)`
	.right-extensions {
		display: flex;
		align-items: center;
	}

	.right-actions {
		padding-left: 0;
		width: 0;
		opacity: 0;
		transition: all 0.07s ease-in-out;
		color: var(--color-nav-item);
	}

	&:hover .right-actions {
		padding-left: var(--distance-i-span);
		width: ${({ width }) => width ?? "1.5em"};
		opacity: 1;
	}
`;
