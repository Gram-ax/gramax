import { classNames } from "@components/libs/classNames";
import React, { CSSProperties, ReactNode, forwardRef } from "react";
import SpinnerLoader from "./SpinnerLoader";
import Tooltip from "./Tooltip";

export const iconPrefixes = {
	fas: "solid",
	far: "regular",
	fal: "light",
	fat: "thin",
	fad: "duotone",
	fab: "brands",
};

export type IconPrefixes = keyof typeof iconPrefixes;

export interface IconProps {
	code?: string;
	prefix?: IconPrefixes;
	style?: CSSProperties;
	faFw?: boolean;
	isAction?: boolean;
	isLoading?: boolean;
	tooltipContent?: ReactNode;
	className?: string;
	svgIcon?: JSX.Element;
	onClick?: (event?: React.MouseEvent<HTMLElement>) => void;
	onClickCapture?: (event?: React.MouseEvent<HTMLElement>) => void;
}

const brandIcons = ["git", "apple", "windows", "linux"];

const Icon = forwardRef((props: IconProps, ref?: React.LegacyRef<HTMLDivElement>) => {
	const {
		code,
		prefix,
		style = { fontWeight: 300 },
		faFw = false,
		isAction = false,
		isLoading = false,
		svgIcon = null,
		tooltipContent,
		className,
		...otherProps
	} = props;

	const Prefix =
		iconPrefixes?.[prefix?.toLowerCase()] ?? (brandIcons.some((i) => code?.includes(i)) ? "brands" : "regular");

	if (isLoading) {
		return (
			<i ref={ref} style={{ display: "flex", alignItems: "center" }}>
				<SpinnerLoader width={16} height={16} lineWidth={1.5} />
			</i>
		);
	}

	if (svgIcon) return svgIcon;

	const mods = {
		"fa-fw": faFw,
		"action-icon": isAction,
	};

	return (
		<Tooltip content={tooltipContent}>
			<i
				ref={ref}
				className={classNames(`fa-${code}`, mods, [className, `fa-${Prefix}`])}
				style={style}
				{...otherProps}
			/>
		</Tooltip>
	);
});

export default Icon;
