import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { useMediaQuery } from "@mui/material";
import Tippy, { TippyProps } from "@tippyjs/react";
import { ReactNode, forwardRef, useState, useEffect, Ref } from "react";
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
	delay?: number;
}

interface TooltipContentProps extends Omit<TooltipProps, "children"> {
	children: ReactNode;
}

const Tooltip = forwardRef((props: TooltipProps, ref?: Ref<Element>) => {
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
		delay = 0,
		...otherProps
	} = props;

	const [finalPlace, setFinalPlace] = useState<Placement>(place);

	useEffect(() => {
		setPlaceCallback(finalPlace);
	}, [finalPlace]);

	if (!content || (hideInMobile && useMediaQuery(cssMedia.narrow))) return children;

	return (
		<Tippy
			content={
				<TooltipContent className={contentClassName} place={finalPlace} arrow={arrow} customStyle={customStyle}>
					{content}
				</TooltipContent>
			}
			duration={0}
			trigger={trigger}
			visible={visible}
			placement={place}
			offset={[0, distance]}
			hideOnClick={visible !== undefined && !hideOnClick ? undefined : hideOnClick}
			onMount={(instance) => {
				setFinalPlace(instance.popperInstance.state.placement);
			}}
			ref={ref}
			appendTo={() => document.body}
			interactive={interactive}
			delay={delay}
			{...otherProps}
		>
			{children}
		</Tippy>
	);
});

const TooltipContent = styled(({ children, className }: TooltipContentProps) => {
	return <div className={className}>{children}</div>;
})`
	${(p) =>
		p.customStyle
			? ""
			: `
	font-size: 10.5px;
	font-weight: 300;
	line-height: 1.2em;
	text-transform: none;
	font-family: "Roboto";
	opacity: 1;
	padding: 6px;
	background: var(--color-tooltip-background);
	color: var(--color-tooltip-text);
	border-radius: 3px;`}

	${(p) => (p.arrow === false ? "" : getArrow(p.place))}
`;

const getArrow = (place: Placement): string => {
	const arrowSize = "5px";
	let result = "";

	if (place.includes("top"))
		result = `
			top: 100%;
			left: 50%;
			transform: translate(-50%, 0);
			border-left: ${arrowSize} solid transparent;
			border-right: ${arrowSize} solid transparent;
			border-top: ${arrowSize} solid var(--color-tooltip-background);
		`;
	else if (place.includes("bottom"))
		result = `
			top: calc(-${arrowSize} + 1px);
			left: 50%;
			transform: translate(-50%, 0);
			border-left: ${arrowSize} solid transparent;
			border-right: ${arrowSize} solid transparent;
			border-bottom: ${arrowSize} solid var(--color-tooltip-background);
		`;
	else if (place.includes("left"))
		result = `
			top: 50%;
			left: 100%;
			transform: translate(0, -50%);
			border-top: ${arrowSize} solid transparent;
			border-bottom: ${arrowSize} solid transparent;
			border-left: ${arrowSize} solid var(--color-tooltip-background);
		`;
	else if (place.includes("right"))
		result = `
			top: 50%;
			left: -${arrowSize};
			transform: translate(0, -50%);
			border-top: ${arrowSize} solid transparent;
			border-bottom: ${arrowSize} solid transparent;
			border-right: ${arrowSize} solid var(--color-tooltip-background);
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
