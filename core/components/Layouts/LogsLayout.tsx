import styled from "@emotion/styled";
import { CSSProperties } from "react";

const LogsLayout = styled(
	({
		children,
		style,
		show = true,
		title,
		className,
	}: {
		children: JSX.Element;
		style?: CSSProperties;
		show?: boolean;
		title?: string;
		className?: string;
	}) => {
		return show ? (
			<div className={"logs-layout " + className} style={style}>
				{title ? (
					<div className="logs-title article">
						<h2>{title}</h2>
					</div>
				) : null}
				{children}
			</div>
		) : null;
	},
)`
	width: 100%;
	max-height: 100%;
	background: var(--color-menu-bg);
	border-radius: var(--radius-x-large);
	padding: 1rem;
	overflow: auto;

	.logs-title {
		background: none;

		> h2 {
			margin-top: 0;
		}
	}
`;

export default LogsLayout;
