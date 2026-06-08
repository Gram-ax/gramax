import { getNewColorFromOld } from "@ext/markdown/elements/highlight/edit/logic/getNewColorFromOld";
import type { ReactElement, ReactNode } from "react";

interface HighlightProps {
	color: string;
	children?: ReactNode;
}

const Highlight = ({ color, children }: HighlightProps): ReactElement => {
	const newColor = getNewColorFromOld(color);
	return (
		<span
			data-highlight={newColor}
			style={{
				backgroundColor: `color-mix(in srgb, var(--color-highlight-${newColor}) 50%, transparent)`,
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
