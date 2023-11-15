import styled from "@emotion/styled";

const ModalLayoutDark = styled(
	({ children, className }: { children: JSX.Element | JSX.Element[]; className?: string }): JSX.Element => {
		return <div className={className}>{children}</div>;
	},
)`
	padding: 4px;
	font-size: 12px;
	width: fit-content;
	color: var(--color-article-bg);
	border-radius: var(--radius-big-block);
	background: var(--color-tooltip-background);

	@media print {
		display: none !important;
	}
`;

export default ModalLayoutDark;
