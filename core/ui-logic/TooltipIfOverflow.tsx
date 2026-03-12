import Tooltip from "@components/Atoms/Tooltip";
import { type ComponentProps, type MutableRefObject, useEffect, useState } from "react";

const getIsOverflow = (element: HTMLElement) => {
	if (!element) return false;
	return element.scrollWidth > element.clientWidth;
};

interface TooltipIfOverflowProps extends Omit<ComponentProps<typeof Tooltip>, "visible"> {
	childrenRef: MutableRefObject<HTMLElement>;
}

const TooltipIfOverflow = (props: TooltipIfOverflowProps) => {
	const { childrenRef, ...rest } = props;
	const [isOverflow, setIsOverflow] = useState(false);
	const [mouseOver, setMouseOver] = useState(false);

	useEffect(() => {
		if (!childrenRef?.current) return;

		const onMouseEnter = () => setMouseOver(true);
		const onMouseLeave = () => setMouseOver(false);

		childrenRef.current.addEventListener("mouseenter", onMouseEnter);
		childrenRef.current.addEventListener("mouseleave", onMouseLeave);

		setIsOverflow(getIsOverflow(childrenRef.current));

		const resizeObserver = new ResizeObserver(() => {
			setIsOverflow(getIsOverflow(childrenRef.current));
		});

		resizeObserver.observe(childrenRef.current);

		return () => {
			if (!childrenRef?.current) return;
			resizeObserver.disconnect();
			childrenRef.current?.removeEventListener("mouseenter", onMouseEnter);
			childrenRef.current?.removeEventListener("mouseleave", onMouseLeave);
		};
	}, [childrenRef?.current]);

	return <Tooltip {...rest} visible={isOverflow && mouseOver} />;
};

export default TooltipIfOverflow;
