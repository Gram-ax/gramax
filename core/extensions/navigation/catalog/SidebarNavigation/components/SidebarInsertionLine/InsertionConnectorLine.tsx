import { cn } from "@core-ui/utils/cn";
import type React from "react";

export type InsertionConnectorLineProps = {
	style?: React.CSSProperties;
	isHidden?: boolean;
};

export const InsertionConnectorLine = ({ style, isHidden }: InsertionConnectorLineProps) => {
	return (
		<div
			className={cn(
				"absolute top-1/2 h-2 w-3 -translate-y-1/2 transition-opacity duration-[160ms]",
				isHidden ? "opacity-0" : "opacity-0 group-hover/insertion:opacity-100",
			)}
			style={style}
		>
			<div className="absolute top-1/2 h-px w-full -translate-y-1/2 rounded-full bg-primary-border" />
		</div>
	);
};
