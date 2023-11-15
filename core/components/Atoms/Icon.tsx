import React, { CSSProperties, ReactNode, forwardRef } from "react";
import SpinnerLoader from "./SpinnerLoader";
import Tooltip from "./Tooltip";

const iconPrefixes = {
	fas: "solid",
	far: "regular",
	fal: "light",
	fat: "thin",
	fad: "duotone",
	fab: "brands",
};

const Icon = forwardRef(
	(
		{
			code,
			prefix,
			color,
			style = { fontWeight: 300 },
			faFw = false,
			isAction = false,
			isLoading = false,
			svgIcon = null,
			tooltipContent,
			className,
			...props
		}: {
			code?: string;
			prefix?: keyof typeof iconPrefixes;
			color?: string;
			style?: CSSProperties;
			faFw?: boolean;
			isAction?: boolean;
			isLoading?: boolean;
			tooltipContent?: ReactNode;
			className?: string;
			svgIcon?: JSX.Element;
			onClick?: (event?: React.MouseEvent<HTMLElement>) => void;
			onClickCapture?: (event?: React.MouseEvent<HTMLElement>) => void;
		},
		ref?: React.LegacyRef<HTMLDivElement>,
	) => {
		if (prefix && prefix.toLowerCase() in iconPrefixes) prefix = iconPrefixes[prefix.toLowerCase()];

		if (isLoading)
			return (
				<i ref={ref} style={{ display: "flex", alignItems: "center" }}>
					<SpinnerLoader width={16} height={16} lineWidth={1.5} />
				</i>
			);

		return svgIcon ? (
			svgIcon
		) : (
			<Tooltip content={tooltipContent}>
				<i
					ref={ref}
					className={`fa-${prefix ? prefix : code?.includes("git") ? "brands" : "regular"} ${
						faFw ? "fa-fw" : ""
					} fa-${code} ${className ?? ""} ${isAction ? "action-icon" : ""}`}
					style={{ color, ...style }}
					{...props}
				/>
			</Tooltip>
		);
	},
);

export default Icon;
