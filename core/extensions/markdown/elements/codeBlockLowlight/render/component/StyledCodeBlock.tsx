import styled from "@emotion/styled";
import { HTMLAttributes, ReactNode } from "react";

const StyledPre = styled.pre`
	background: var(--color-code-bg) !important;
	border-radius: var(--radius-small);
	position: relative;
	padding: 0 !important;
	font-size: 0.8em;
	line-height: 1.5625em;
`;

const ChildWrapper = styled.div`
	overflow: auto;
	white-space: pre !important;
`;

interface StyledCodeBlockProps extends HTMLAttributes<HTMLPreElement> {
	children: ReactNode;
	isPrint?: boolean;
}

const StyledCodeBlock = (props: StyledCodeBlockProps) => {
	const { children, ...rest } = props;

	return (
		<StyledPre {...rest}>
			<ChildWrapper className="child-wrapper">{children}</ChildWrapper>
		</StyledPre>
	);
};

export default StyledCodeBlock;
