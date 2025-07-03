import styled from "@emotion/styled";
import { ReactNode } from "react";

interface BlockWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
	children: ReactNode;
	readOnly?: boolean;
}

const Wrapper = styled.div<{ readOnly?: boolean }>`
	border: 1px dashed var(--color-line);
	border-radius: var(--radius-medium);
	margin: 4px -8px 0.85em -9px;
	padding: 4px 8px;
	${({ readOnly }) =>
		readOnly &&
		`
		cursor: default;
		input {
		font-size: 1em;
			outline: none;
			border: none;
			width: 100%;
			height: 100%;
			background-color: transparent;
			line-height: 1.3 !important;
		}

		input:focus {
			outline: none;
			border: none;
		}
	`}

	> div > div > :last-child,
	p:last-of-type {
		margin-bottom: 0 !important;
	}
`;

const BlockWrapper = ({ children, readOnly = false, ...props }: BlockWrapperProps) => {
	if (readOnly) {
		return (
			<Wrapper data-focusable={true} readOnly={readOnly} {...props}>
				{children}
			</Wrapper>
		);
	}

	return (
		<Wrapper data-editable={true} {...props}>
			{children}
		</Wrapper>
	);
};

export default BlockWrapper;
