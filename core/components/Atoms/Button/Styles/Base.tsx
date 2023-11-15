import styled from "@emotion/styled";
import { HTMLAttributes, ReactNode } from "react";

const Button = styled(
	({
		children,
		className,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		useDefaultStyle,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		fullWidth,
		...props
	}: {
		children: ReactNode;
		fullWidth?: boolean;
		useDefaultStyle?: boolean;
		className?: string;
	} & HTMLAttributes<HTMLDivElement>) => {
		return (
			<div {...props} className={className}>
				{children}
			</div>
		);
	},
)`
	display: flex;
	cursor: pointer;
	font-weight: 300;
	align-items: center;
	text-decoration: none;
	justify-content: center;
	padding: 0.33rem 0.88rem;
	width: ${(p) => (p.fullWidth ? "100%" : "fit-content")};

	${(p) =>
		p.useDefaultStyle === true
			? `	border-radius: var(--radius-block);
			background: var(--color-code-bg);
			color: var(--color-article-heading-text);
			border: 1px solid var(--color-article-heading-text);
		
			:hover {
				opacity: 0.8;
				color: var(--color-article-bg);
				background: var(--color-article-heading-text);
			}`
			: ``}
`;

export default Button;
