import styled from "@emotion/styled";

const BarLayout = styled(
	({
		children,
		className,
		padding,
		height,
		...props
	}: {
		children?: JSX.Element;
		height?: string | number;
		gap?: string | number;
		padding?: string | { top?: string; right?: string; bottom?: string; left?: string };
		className?: string;
	} & React.HTMLProps<HTMLDivElement>) => {
		return (
			<div className={className} {...props}>
				{children}
			</div>
		);
	},
)`
	width: 100%;
	display: flex;
	align-items: center;

	${(p) => {
		return `
		height: ${!p.height ? "64px" : typeof p.height === "string" ? p.height : p.height + "px"};
		gap: ${!p.gap ? 0 : typeof p.gap === "string" ? p.gap : p.gap + "px"};
		 ${
				!p.padding
					? ""
					: typeof p.padding === "string"
						? `padding: ${p.padding}`
						: `
						${p.padding.top ? `padding-top: ${p.padding.top};` : ""}
						${p.padding.right ? `padding-right: ${p.padding.right};` : ""}
						${p.padding.bottom ? `padding-bottom: ${p.padding.bottom};` : ""}
						${p.padding.left ? `padding-left: ${p.padding.left};` : ""}`
			};
		`;
	}}
`;

export default BarLayout;
