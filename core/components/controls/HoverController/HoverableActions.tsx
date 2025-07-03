import ActionButtonContainer from "@components/controls/HoverController/ActionButtonContainer";
import { classNames } from "@components/libs/classNames";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import { useOutsideClick } from "@core-ui/hooks/useOutsideClick";
import styled from "@emotion/styled";
import { ReactNode, useEffect, RefObject, useCallback, memo, useRef, CSSProperties, useState } from "react";
import { Instance } from "tippy.js";

type Placement = "top" | "inner";

interface HoverProps {
	children: ReactNode;
	hoverElementRef: RefObject<HTMLElement>;
	setIsHovered: (isHovered: boolean) => void;
	isHovered: boolean;
	selected?: boolean;
	hideOnClick?: boolean;
	isOver?: boolean;
	actionsStyle?: CSSProperties;
	leftActions?: ReactNode;
	rightActions?: ReactNode;
	className?: string;
	placement?: Placement;
}

const shouldTippyHide = (target: HTMLElement, parent: HTMLElement) => {
	const tippyElement = target?.closest("[data-tippy-root]");
	if (!tippyElement) return false;

	const instance = (tippyElement as any)._tippy as Instance;
	if (!instance) return false;
	if (parent.contains(instance.reference)) return true;

	return false;
};

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
		actionsStyle,
		setIsHovered,
		hideOnClick = true,
		placement = "inner",
	} = props;
	if (!setIsHovered) return children;
	const actionsRef = useRef<HTMLDivElement>(null);
	const [isHideOnClick] = useState(hideOnClick);
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
		debounceHide.cancel();
	}, [isHovered, actionsRef.current]);

	if (isHideOnClick) useOutsideClick([hoverElementRef.current], handleHide);

	useEffect(() => {
		const hoverElement = hoverElementRef.current;
		let hoverable: Window | Element = hoverElement?.querySelector("[data-hover-target='true']");
		if ((hoverable as HTMLIFrameElement)?.contentWindow) hoverable = (hoverable as HTMLIFrameElement).contentWindow;
		if (!hoverElement) return;

		const onMouseLeave = (event?: MouseEvent) => {
			if (selected) return;
			const relatedTarget = event?.relatedTarget as HTMLElement;
			const isTippyRelated = shouldTippyHide(relatedTarget, hoverElement);
			if (relatedTarget && (hoverElement.contains(relatedTarget) || isTippyRelated)) return;

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
	}, [hoverElementRef.current, selected]);

	useEffect(() => {
		window.addEventListener("blur", handleHide);

		return () => {
			window.removeEventListener("blur", handleHide);
		};
	}, [actionsRef.current]);

	return (
		<>
			<div
				ref={actionsRef}
				className={classNames(className, { isOver }, ["node-actions", placement])}
				data-drag-handle
				contentEditable={false}
			>
				<div className="actions-left" style={actionsStyle}>
					{isHovered && leftActions && <ActionButtonContainer>{leftActions}</ActionButtonContainer>}
				</div>
				<div className="actions-right" style={actionsStyle}>
					{isHovered && <ActionButtonContainer>{rightActions}</ActionButtonContainer>}
				</div>
			</div>
			{children}
		</>
	);
};

export default memo(styled(HoverableActions)`
	&.node-actions {
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
		user-select: none;

		.iconFrame {
			padding: 0.33em 0 !important;
		}
	}

	&.top {
		right: 0;
		top: -3.5em !important;
		margin-right: 0;
	}

	.actions-left {
		display: flex;
		left: 0;
	}

	.actions-right {
		display: flex;
		right: 0;
	}

	&.isHovered,
	.isHovered {
		opacity: 1;
	}

	@media print {
		.node-actions {
			display: none;
		}
	}
`);
