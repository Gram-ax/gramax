import styled from "@emotion/styled";
import React, { InputHTMLAttributes } from "react";

const Input = styled(
	React.forwardRef(
		(props?: InputHTMLAttributes<HTMLInputElement>, ref?: React.MutableRefObject<HTMLInputElement>) => {
			return <input {...props} ref={ref} />;
		},
	),
)`
	outline: 0;
	width: 100%;
	height: 34px;
	border: none;
	display: block;
	font-size: 14px;
	padding: 6px 12px;
	border-radius: 4px;
	color: var(--color-prism-text);
	background: var(--color-code-bg);
`;

export default Input;
