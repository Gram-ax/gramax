import styled from "@emotion/styled";
import { forwardRef } from "react";

interface ModalLayoutDarkProps {
	children: JSX.Element | JSX.Element[];
	className?: string;
}

const ModalLayoutDark = forwardRef<HTMLDivElement, ModalLayoutDarkProps>(
	({ children, className }: ModalLayoutDarkProps, ref): JSX.Element => {
		return (
			<div ref={ref} className={className}>
				{children}
			</div>
		);
	},
);

export default styled(ModalLayoutDark)`
	padding: 4px;
	font-size: 12px;
	width: fit-content;
	color: var(--color-article-bg);
	border-radius: var(--radius-x-large);
	background: var(--color-tooltip-background);

	@media print {
		display: none !important;
	}
`;
