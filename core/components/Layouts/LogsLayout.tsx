import { cn } from "@core-ui/utils/cn";
import type { CSSProperties } from "react";

const LogsLayout = ({
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
		<div className={cn("w-full max-h-full rounded-lg p-4 overflow-auto bg-primary-bg", className)} style={style}>
			{title ? (
				<div className="logs-title article !bg-transparent">
					<h2 className="mt-0">{title}</h2>
				</div>
			) : null}
			{children}
		</div>
	) : null;
};

export default LogsLayout;
