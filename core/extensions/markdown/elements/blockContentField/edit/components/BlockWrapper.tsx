import styled from "@emotion/styled";
import { ReactNode } from "react";

const Wrapper = styled.div<{ readOnly?: boolean }>`
	border: 1px dashed var(--color-comment-bg);
	border-radius: var(--radius-medium);
	margin: -4px -8px 0.2em -9px;
	padding: 4px 8px;
	${({ readOnly }) =>
		readOnly &&
		`
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
	> p:last-of-type {
		margin-bottom: 0 !important;
	}
`;

const BlockWrapper = ({ children, readOnly = false }: { children: ReactNode; readOnly?: boolean }) => {
	if (readOnly) {
		return (
			<Wrapper data-focusable={true} readOnly={readOnly} contentEditable={false}>
				{children}
			</Wrapper>
		);
	}

	return <Wrapper data-editable={true}>{children}</Wrapper>;
};

export default BlockWrapper;
