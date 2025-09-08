import { ReactElement, ReactNode } from "react";

interface HighlightProps {
	color: string;
	children?: ReactNode;
}

const Highlight = ({ color, children }: HighlightProps): ReactElement => {
	return (
		<span
			data-highlight={color}
			style={{
				backgroundColor: `var(--color-highlight-${color})`,
				borderRadius: "var(--radius-medium)",
				color: "black",
				padding: "2px 2px",
			}}
		>
			{children}
		</span>
	);
};

export default Highlight;
