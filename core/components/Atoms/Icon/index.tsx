import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { CSSProperties, ForwardedRef, forwardRef, MouseEvent, ReactNode } from "react";
import { Placement, Props } from "tippy.js";
import SpinnerLoader from "../SpinnerLoader";
import Tooltip from "../Tooltip";
import LucideIcon from "./LucideIcon";

export interface IconProps {
	code?: string;
	className?: string;
	svgStyle?: CSSProperties;
	size?: string;
	isAction?: boolean;
	isLoading?: boolean;
	strokeWidth?: string | number;
	style?: CSSProperties;
	viewBox?: string;
	tooltipContent?: ReactNode;
	tooltipDelay?: Props["delay"];
	tooltipAppendTo?: Props["appendTo"];
	onClick?: (event?: MouseEvent<HTMLElement>) => void;
	onMouseUp?: (event?: MouseEvent<HTMLElement>) => void;
	onClickCapture?: (event?: MouseEvent<HTMLElement>) => void;
	fw?: boolean;
	tooltipPlace?: Placement;
	dataQa?: string;
}

const Icon = forwardRef((props: IconProps, ref: ForwardedRef<HTMLElement>) => {
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
		tooltipDelay,
		tooltipAppendTo,
		dataQa,
		size,
		...otherProps
	} = props;

	if (isLoading) {
		return (
			<i style={{ display: "flex", alignItems: "center", ...style }}>
				<SpinnerLoader height={16} lineWidth={1.5} width={16} />
			</i>
		);
	}
	const IconComponent = LucideIcon(code);

	if (!IconComponent) return <Icon {...props} code="circle-help" tooltipContent="Unknown icon" />;

	return (
		<Tooltip appendTo={tooltipAppendTo} content={tooltipContent} delay={tooltipDelay} place={TooltipPlace}>
			<i
				className={classNames(className, { "action-icon": isAction, "li-fw": fw })}
				data-qa={dataQa}
				ref={ref}
				style={style}
				{...otherProps}
			>
				<IconComponent
					height={size || "1em"}
					strokeWidth={strokeWidth}
					style={svgStyle}
					viewBox={viewBox ?? "0 0 24 24"}
					width={size || "1em"}
				/>
			</i>
		</Tooltip>
	);
});

export default styled(Icon)`
	&.li-fw {
		width: 1.25em;
		text-align: center;
	}

	vertical-align: middle;
	display: inline-block;
	line-height: 1px;
`;
