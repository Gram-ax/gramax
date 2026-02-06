import { classNames } from "@components/libs/classNames";
import useElementExistence from "@core-ui/hooks/useElementExistence";
import { mediaQueries } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { useMediaQuery } from "@react-hook/media-query";
import Tippy, { TippyProps } from "@tippyjs/react";
import { forwardRef, ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { Placement } from "tippy.js";

interface TooltipProps extends TippyProps {
	place?: Placement;
	distance?: number;
	arrow?: boolean;
	hideInMobile?: boolean;
	trigger?: string;
	customStyle?: boolean;
	setPlaceCallback?: (place: string) => void;
	hideOnClick?: boolean;
	contentClassName?: string;
	interactive?: boolean;
	inverseStyle?: boolean;
	delay?: number | [number, number];
}

interface TooltipContentProps extends Omit<TooltipProps, "children"> {
	children: ReactNode;
}

export const DEFAULT_TOOLTIP_SHOW_DELAY = 560;
const DEFAULT_DELAY = [DEFAULT_TOOLTIP_SHOW_DELAY, 0] as [number, number];

const Tooltip = forwardRef((props: TooltipProps, ref?: RefObject<Element>) => {
	const {
		children,
		content,
		place = "top",
		trigger,
		distance = 10,
		contentClassName,
		visible,
		arrow = true,
		hideInMobile = true,
		customStyle = false,
		hideOnClick = false,
		setPlaceCallback = () => {},
		interactive = false,
		delay,
		interactiveBorder = 10,
		inverseStyle,
		appendTo = () => document.body,
		onMount,
		...otherProps
	} = props;

	const tooltipRef = ref ?? useRef();
	const exists = useElementExistence(tooltipRef);
	const [finalPlace, setFinalPlace] = useState<Placement>(place);
	const isNarrow = useMediaQuery(mediaQueries.narrow);

	useEffect(() => {
		setPlaceCallback(finalPlace);
	}, [finalPlace]);

	if (!content || (hideInMobile && isNarrow)) return children;

	return (
		<Tippy
			appendTo={appendTo}
			content={
				exists && (
					<TooltipContent
						arrow={arrow}
						className={contentClassName}
						customStyle={customStyle}
						inverseStyle={inverseStyle}
						place={finalPlace}
					>
						{content}
					</TooltipContent>
				)
			}
			delay={interactive ? delay : DEFAULT_DELAY}
			duration={0}
			hideOnClick={visible !== undefined && !hideOnClick ? undefined : hideOnClick}
			interactive={interactive}
			interactiveBorder={interactiveBorder}
			maxWidth="30em"
			offset={[0, distance]}
			onMount={(instance) => {
				onMount?.(instance);
				setFinalPlace(instance.popperInstance.state.placement);
			}}
			placement={place}
			ref={tooltipRef}
			trigger={trigger}
			visible={visible}
			{...otherProps}
			className={interactive ? "interactive-tooltip" : undefined}
		>
			{children}
		</Tippy>
	);
});

const TooltipContent = styled((props: TooltipContentProps) => {
	const { children, customStyle, inverseStyle, className } = props;
	return <div className={classNames(className, { defaultStyle: !customStyle, inverseStyle })}>{children}</div>;
})`
	border-radius: var(--radius-small);

	&.defaultStyle {
		font-size: 10.5px;
		font-weight: 300;
		line-height: 1.2em;
		text-transform: none;
		font-family: "Roboto", sans-serif;
		opacity: 1;
		padding: 6px;
		color: var(--color-tooltip-text);
		background: var(--color-tooltip-background);
	}

	&.inverseStyle {
		box-shadow: var(--menu-tooltip-shadow);
		color: var(--color-tooltip-text-inverse);
		background: var(--color-tooltip-background-inverse);
	}

	${(p) => (p.arrow === false ? "" : getArrow(p.place, p.inverseStyle))}
`;

const getArrow = (place: Placement, inverseStyle: boolean): string => {
	const arrowSize = "5px";
	let result = "";
	const color = inverseStyle ? "var(--color-tooltip-background-inverse)" : "var(--color-tooltip-background)";

	if (place.includes("top"))
		result = `
			top: 100%;
			left: 50%;
			transform: translate(-50%, 0);
			border-left: ${arrowSize} solid transparent;
			border-right: ${arrowSize} solid transparent;
			border-top: ${arrowSize} solid ${color};
		`;
	else if (place.includes("bottom"))
		result = `
			top: calc(-${arrowSize} + 1px);
			left: 50%;
			transform: translate(-50%, 0);
			border-left: ${arrowSize} solid transparent;
			border-right: ${arrowSize} solid transparent;
			border-bottom: ${arrowSize} solid ${color};
		`;
	else if (place.includes("left"))
		result = `
			top: 50%;
			left: 100%;
			transform: translate(0, -50%);
			border-top: ${arrowSize} solid transparent;
			border-bottom: ${arrowSize} solid transparent;
			border-left: ${arrowSize} solid ${color};
		`;
	else if (place.includes("right"))
		result = `
			top: 50%;
			left: -${arrowSize};
			transform: translate(0, -50%);
			border-top: ${arrowSize} solid transparent;
			border-bottom: ${arrowSize} solid transparent;
			border-right: ${arrowSize} solid ${color};
		`;

	return `
		::after {
			position: absolute;
			content: "";
			${result}
		}
	`;
};

export default Tooltip;
