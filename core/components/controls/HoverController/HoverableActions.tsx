import ActionButtonContainer from "@components/controls/HoverController/ActionButtonContainer";
import { classNames } from "@components/libs/classNames";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import styled from "@emotion/styled";
import { ReactNode, useEffect, RefObject, useCallback, memo, useRef } from "react";

interface HoverProps {
	children: ReactNode;
	hoverElementRef: RefObject<HTMLElement>;
	setIsHovered: (isHovered: boolean) => void;
	isHovered: boolean;
	selected?: boolean;
	isOver?: boolean;
	leftActions?: ReactNode;
	rightActions?: ReactNode;
	className?: string;
}

const HoverableActions = (props: HoverProps) => {
	const {
		children,
		hoverElementRef,
		isOver,
		rightActions,
		className,
		selected,
		leftActions,
		isHovered,
		setIsHovered,
	} = props;
	if (!setIsHovered) return children;
	const actionsRef = useRef<HTMLDivElement>(null);
	const debounceHide = useDebounce((f: () => void) => f(), 150);

	const handleHide = useCallback(() => {
		actionsRef.current?.classList.remove("isHovered");
		debounceHide.start(() => setIsHovered?.(false));
	}, [actionsRef.current]);

	const onMouseEnter = useCallback(() => {
		const actionsElement = actionsRef.current;
		if (actionsElement?.classList.contains("isHovered") && isHovered) return;
		actionsElement?.classList.add("isHovered");
		setIsHovered?.(true);
	}, [isHovered, actionsRef.current]);

	useEffect(() => {
		const hoverElement = hoverElementRef.current;
		let hoverable: Window | Element = hoverElement?.querySelector("[data-hover-target='true']");
		if ((hoverable as HTMLIFrameElement)?.contentWindow) hoverable = (hoverable as HTMLIFrameElement).contentWindow;
		if (!hoverElement) return;

		const onMouseLeave = (event?: MouseEvent) => {
			if (selected) return;
			const relatedTarget = event?.relatedTarget as HTMLElement;
			if (relatedTarget && hoverElement.contains(relatedTarget)) return;

			handleHide();
		};

		hoverable?.addEventListener("mousemove", onMouseEnter);
		hoverElement.addEventListener("mousemove", onMouseEnter);
		hoverElement.addEventListener("mouseleave", onMouseLeave);

		return () => {
			debounceHide.cancel();
			hoverable?.removeEventListener("mousemove", onMouseEnter);
			hoverElement.removeEventListener("mousemove", onMouseEnter);
			hoverElement.removeEventListener("mouseleave", onMouseLeave);
		};
	}, [selected]);

	return (
		<div className={className}>
			<div ref={actionsRef} className={classNames("node-actions", { isOver })} contentEditable={false}>
				<div className="actions-left">
					{isHovered && leftActions && <ActionButtonContainer>{leftActions}</ActionButtonContainer>}
				</div>
				<div className="actions-right">
					{isHovered && <ActionButtonContainer>{rightActions}</ActionButtonContainer>}
				</div>
			</div>
			<div>{children}</div>
		</div>
	);
};

export default memo(styled(HoverableActions)`
	position: relative;
	user-select: none;

	.node-actions {
		display: flex;
		font-size: 0.7em;
		width: ${(props) => (props.leftActions ? "calc(100% - 1em)" : "auto")};
		justify-content: space-between;
		position: absolute;
		top: 0;
		right: ${(props) => (props.leftActions ? "unset" : "0")};
		margin: 0.5rem;
		transform-origin: top;
		opacity: 0;
		z-index: var(--z-index-base);
		transition: opacity var(--transition-time-fast) ease-in-out;

		.iconFrame {
			padding: 0.33em 0 !important;
		}
	}

	.isOver {
		top: -2.5em !important;
	}

	.actions-left {
		display: flex;
		left: 0;
	}

	.actions-right {
		display: flex;
		right: 0;
	}

	.isHovered {
		opacity: 1;
	}
`);
