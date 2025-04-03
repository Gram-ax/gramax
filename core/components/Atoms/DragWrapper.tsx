import { forwardRef, MouseEvent as ReactMouseEvent, ReactNode, RefObject, useCallback, useRef } from "react";
import styled from "@emotion/styled";
import { classNames } from "@components/libs/classNames";

interface DragWrapperProps {
	children: ReactNode;
	onDragStart?: (e: ReactMouseEvent<HTMLDivElement>) => void;
	onDragEnd?: (e: MouseEvent) => void;
	className?: string;
}

const DragWrapper = forwardRef((props: DragWrapperProps, ref: RefObject<HTMLDivElement>) => {
	const { children, className, onDragStart, onDragEnd } = props;
	const newRef = ref || useRef<HTMLDivElement>(null);

	const mouseDown = useCallback(
		(event: ReactMouseEvent<HTMLDivElement>) => {
			const wrapper = newRef.current;
			if (!wrapper) return;

			onDragStart?.(event);

			const startClientX = event.clientX;
			const startClientY = event.clientY;

			const startLeft = isNaN(parseFloat(wrapper.style.left)) ? 0 : parseFloat(wrapper.style.left);
			const startTop = isNaN(parseFloat(wrapper.style.top)) ? 0 : parseFloat(wrapper.style.top);

			const viewportWidth = document.documentElement.clientWidth;
			const viewportHeight = document.documentElement.clientHeight;

			const elementWidth = wrapper.offsetWidth;
			const elementHeight = wrapper.offsetHeight;

			const onMouseMove = (e: MouseEvent) => {
				const deltaX = e.clientX - startClientX;
				const deltaY = e.clientY - startClientY;

				let newX = startLeft + deltaX;
				let newY = startTop + deltaY;

				const rightBoundary = viewportWidth - elementWidth;
				const bottomBoundary = viewportHeight - elementHeight;

				newX = Math.max(0, Math.min(newX, rightBoundary));
				newY = Math.max(0, Math.min(newY, bottomBoundary));

				wrapper.style.left = `${newX}px`;
				wrapper.style.top = `${newY}px`;
			};

			const onMouseUp = (event: MouseEvent) => {
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);

				onDragEnd?.(event);
			};

			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);

			event.preventDefault();
		},
		[newRef.current, onDragStart, onDragEnd],
	);

	return (
		<div className={classNames(className)}>
			<div className="drag-handle" onMouseDown={mouseDown} />
			{children}
		</div>
	);
});

export default styled(DragWrapper)`
	user-select: none;
	max-width: inherit;
	max-height: inherit;
	height: 100%;
	width: 100%;

	.drag-handle:active {
		cursor: grabbing;
	}

	.drag-handle {
		cursor: grab;
		position: absolute;
		height: 0.6rem;
		width: 100%;
		z-index: var(--z-index-base);
	}
`;
