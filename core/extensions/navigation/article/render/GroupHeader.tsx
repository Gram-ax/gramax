import styled from "@emotion/styled";
import { HTMLAttributes } from "react";

interface GroupHeaderProps extends HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode;
}

const GroupHeaderNotStyled = ({ children, className, ...props }: GroupHeaderProps) => {
	return (
		<div className={`group-header ${className}`} {...props}>
			{children}
		</div>
	);
};

export const GroupHeader = styled(GroupHeaderNotStyled)`
	width: 100%;
	margin-bottom: -0.5em;

	&:hover {
		cursor: pointer;
		color: var(--color-primary) !important;
	}
`;
