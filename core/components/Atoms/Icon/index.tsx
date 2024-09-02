import { classNames } from "@components/libs/classNames";
import { CSSProperties, MouseEvent, ReactNode } from "react";
import SpinnerLoader from "../SpinnerLoader";
import Tooltip from "../Tooltip";
import { Placement } from "tippy.js";
import styled from "@emotion/styled";
import LucideIcon from "./LucideIcon";

export interface IconProps {
	code?: string;
	className?: string;
	svgStyle?: CSSProperties;
	isAction?: boolean;
	isLoading?: boolean;
	strokeWidth?: string | number;
	style?: CSSProperties;
	viewBox?: string;
	tooltipContent?: ReactNode;
	onClick?: (event?: MouseEvent<HTMLElement>) => void;
	onMouseUp?: (event?: MouseEvent<HTMLElement>) => void;
	onClickCapture?: (event?: MouseEvent<HTMLElement>) => void;
	fw?: boolean;
	tooltipPlace?: Placement;
}

const Icon = (props: IconProps) => {
	const {
		code,
		className,
		isAction = false,
		tooltipContent,
		style,
		svgStyle,
		strokeWidth = "max(0.075em, 1.3px)",
		isLoading = false,
		fw,
		viewBox,
		tooltipPlace: TooltipPlace,
		...otherProps
	} = props;

	if (isLoading) {
		return (
			<i style={{ display: "flex", alignItems: "center", ...style }}>
				<SpinnerLoader width={16} height={16} lineWidth={1.5} />
			</i>
		);
	}
	const IconComponent = LucideIcon(code);

	if (!IconComponent) return <Icon {...props} tooltipContent="Unknown icon" code="circle-help" />;

	return (
		<Tooltip content={tooltipContent} place={TooltipPlace}>
			<i
				style={style}
				className={classNames(className, { "action-icon": isAction, "li-fw": fw })}
				{...otherProps}
			>
				<IconComponent
					width="1em"
					height="1em"
					style={svgStyle}
					strokeWidth={strokeWidth}
					viewBox={viewBox ?? "0 0 24 24"}
				/>
			</i>
		</Tooltip>
	);
};

export default styled(Icon)`
	&.li-fw {
		width: 1.25em;
		text-align: center;
	}

	vertical-align: middle;
	display: inline-block;
	line-height: 1px;
`;
