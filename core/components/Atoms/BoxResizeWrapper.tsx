import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import {
	forwardRef,
	MouseEventHandler,
	MouseEvent as ReactMouseEvent,
	ReactNode,
	RefObject,
	useCallback,
	useRef,
} from "react";

interface BoxResizeWrapperProps {
	children: ReactNode;
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;
	onResizeStart?: (event: ReactMouseEvent<HTMLDivElement>) => void;
	onResizeEnd?: (event: MouseEvent) => void;
	className?: string;
}

interface HandleProps {
	direction: ResizeDirection;
	onMouseDown: MouseEventHandler<HTMLDivElement>;
}

export enum ResizeDirection {
	TOP_LEFT = "top-left",
	TOP_RIGHT = "top-right",
	BOTTOM_LEFT = "bottom-left",
	BOTTOM_RIGHT = "bottom-right",
}

const applyConstraints = (value: number, min: number, max: number): number => {
	return Math.min(Math.max(value, min), max);
};

const Handle = ({ direction, onMouseDown }: HandleProps) => {
	return (
		<div
			className={`resize-handle resize-handle-${direction}`}
			data-resize-direction={direction}
			onMouseDown={onMouseDown}
		/>
	);
};

const BoxResizeWrapper = forwardRef((props: BoxResizeWrapperProps, ref: RefObject<HTMLDivElement>) => {
	const {
		children,
		className,
		minWidth = 100,
		minHeight = 100,
		maxWidth = 500,
		maxHeight = 800,
		onResizeStart,
		onResizeEnd,
	} = props;
	const newRef = ref || useRef<HTMLDivElement>(null);

	const onMouseDown: MouseEventHandler<HTMLDivElement> = useCallback(
		(event) => {
			event.preventDefault();
			event.stopPropagation();

			const currentHandle = event.target as HTMLDivElement;
			const viewportWidth = document.documentElement.clientWidth;
			const viewportHeight = document.documentElement.clientHeight;

			const wrapper = newRef.current;

			const startWidth = wrapper.offsetWidth;
			const startHeight = wrapper.offsetHeight;
			const startLeft = parseFloat(wrapper.style.left);
			const startTop = parseFloat(wrapper.style.top);

			const startX = event.clientX;
			const startY = event.clientY;

			const direction = currentHandle.dataset.resizeDirection;

			onResizeStart?.(event);

			const onMouseMove = (event: MouseEvent) => {
				const deltaX = event.clientX - startX;
				const deltaY = event.clientY - startY;

				let newWidth = startWidth;
				let newHeight = startHeight;
				let newTop = startTop;
				let newLeft = startLeft;

				switch (direction) {
					case ResizeDirection.TOP_LEFT:
						newWidth = applyConstraints(startWidth - deltaX, minWidth, maxWidth);
						newHeight = applyConstraints(startHeight - deltaY, minHeight, maxHeight);
						newLeft = startLeft + (startWidth - newWidth);
						newTop = startTop + (startHeight - newHeight);
						break;
					case ResizeDirection.TOP_RIGHT:
						newWidth = applyConstraints(startWidth + deltaX, minWidth, maxWidth);
						newHeight = applyConstraints(startHeight - deltaY, minHeight, maxHeight);
						newTop = startTop + (startHeight - newHeight);
						break;
					case ResizeDirection.BOTTOM_LEFT:
						newWidth = applyConstraints(startWidth - deltaX, minWidth, maxWidth);
						newHeight = applyConstraints(startHeight + deltaY, minHeight, maxHeight);
						newLeft = startLeft + (startWidth - newWidth);
						break;
					case ResizeDirection.BOTTOM_RIGHT:
						newWidth = applyConstraints(startWidth + deltaX, minWidth, maxWidth);
						newHeight = applyConstraints(startHeight + deltaY, minHeight, maxHeight);
						break;
				}

				newLeft = applyConstraints(newLeft, 0, viewportWidth - newWidth);
				newTop = applyConstraints(newTop, 0, viewportHeight - newHeight);

				wrapper.style.width = `${newWidth}px`;
				wrapper.style.height = `${newHeight}px`;
				wrapper.style.left = `${newLeft}px`;
				wrapper.style.top = `${newTop}px`;

				wrapper.style.maxHeight = `${newHeight}px`;
				wrapper.style.maxWidth = `${newWidth}px`;
			};

			const onMouseUp = (event) => {
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);
				onResizeEnd?.(event);
			};

			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);
		},
		[newRef.current, onResizeStart, onResizeEnd],
	);

	return (
		<div className={classNames(className, undefined, ["resize-wrapper"])} ref={newRef}>
			<div className="resize-handles">
				<Handle direction={ResizeDirection.TOP_LEFT} onMouseDown={onMouseDown} />
				<Handle direction={ResizeDirection.TOP_RIGHT} onMouseDown={onMouseDown} />
				<Handle direction={ResizeDirection.BOTTOM_RIGHT} onMouseDown={onMouseDown} />
				<Handle direction={ResizeDirection.BOTTOM_LEFT} onMouseDown={onMouseDown} />
			</div>
			{children}
		</div>
	);
});

export default styled(BoxResizeWrapper)`
	max-width: inherit;
	max-height: inherit;
	height: 100%;
	width: 100%;

	.resize-handle {
		position: absolute;
		width: 1.875rem;
		height: 1.875rem;
		border: 2px solid transparent;
		user-select: none;
		z-index: var(--z-index-base);
	}

	.resize-handle-top-left {
		left: -0.125rem;
		top: -0.125rem;
		cursor: nwse-resize;
		border-right: none;
		border-bottom: none;
		border-bottom-right-radius: 9999px;
	}

	.resize-handle-top-right {
		right: -0.125rem;
		top: -0.125rem;
		cursor: nesw-resize;
		border-left: none;
		border-bottom: none;
		border-bottom-left-radius: 9999px;
	}

	.resize-handle-bottom-left {
		left: -0.125rem;
		bottom: -0.125rem;
		border-top: none;
		border-right: none;
		cursor: nesw-resize;
		border-top-right-radius: 9999px;
	}

	.resize-handle-bottom-right {
		right: -0.125rem;
		bottom: -0.125rem;
		border-left: none;
		border-top: none;
		cursor: nwse-resize;
		border-top-left-radius: 9999px;
	}
`;
