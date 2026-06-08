import { useTouchHandler } from "@core-ui/hooks/useTouchHandler";
import { type HTMLAttributes, useRef } from "react";

export type SwipeHandlers = Pick<HTMLAttributes<HTMLDivElement>, "onMouseDown" | "onPointerDown" | "onTouchStart">;
type SwipeDirection = "left" | "right";

interface SwipeState {
	startX: number;
	startY: number;
	deltaX: number;
	deltaY: number;
}

interface UseSidebarSwipeProps {
	enabled: boolean;
	isOpen: boolean;
	onOpen: () => void;
	onClose: () => void;
	openDirection?: SwipeDirection;
	thresholdPx?: number;
	directionRatio?: number;
}

interface UseSidebarSwipeResult {
	openSwipeHandlers: SwipeHandlers;
	closeSwipeHandlers: SwipeHandlers;
}

const DEFAULT_THRESHOLD_PX = 48;
const DEFAULT_DIRECTION_RATIO = 1.25;

const createSwipeState = (): SwipeState => ({ startX: 0, startY: 0, deltaX: 0, deltaY: 0 });

const isHorizontalSwipe = (deltaX: number, deltaY: number, thresholdPx: number, directionRatio: number) =>
	Math.abs(deltaX) >= thresholdPx && Math.abs(deltaX) > Math.abs(deltaY) * directionRatio;

const isSwipeInDirection = (
	deltaX: number,
	deltaY: number,
	direction: SwipeDirection,
	thresholdPx: number,
	directionRatio: number,
) => {
	if (!isHorizontalSwipe(deltaX, deltaY, thresholdPx, directionRatio)) return false;
	return direction === "left" ? deltaX < 0 : deltaX > 0;
};

const useSidebarSwipe = (props: UseSidebarSwipeProps): UseSidebarSwipeResult => {
	const {
		enabled,
		isOpen,
		onOpen,
		onClose,
		openDirection = "left",
		thresholdPx = DEFAULT_THRESHOLD_PX,
		directionRatio = DEFAULT_DIRECTION_RATIO,
	} = props;

	const closeDirection: SwipeDirection = openDirection === "left" ? "right" : "left";

	const openSwipeState = useRef<SwipeState>(createSwipeState());
	const closeSwipeState = useRef<SwipeState>(createSwipeState());

	const updateSwipeState = (swipeState: SwipeState, clientX: number, clientY: number) => {
		swipeState.deltaX = clientX - swipeState.startX;
		swipeState.deltaY = clientY - swipeState.startY;
	};

	const openTouchHandlers = useTouchHandler({
		preventDefault: false,
		stopPropagation: false,
		capturePointer: false,
		onStart: (clientX, clientY) => {
			openSwipeState.current = { startX: clientX, startY: clientY, deltaX: 0, deltaY: 0 };
		},
		onMove: (_, __, clientX, clientY) => {
			updateSwipeState(openSwipeState.current, clientX, clientY);
		},
		onEnd: () => {
			const { deltaX, deltaY } = openSwipeState.current;

			if (enabled && !isOpen && isSwipeInDirection(deltaX, deltaY, openDirection, thresholdPx, directionRatio)) {
				onOpen();
			}

			openSwipeState.current = createSwipeState();
		},
	});

	const closeTouchHandlers = useTouchHandler({
		preventDefault: false,
		stopPropagation: false,
		capturePointer: false,
		onStart: (clientX, clientY) => {
			closeSwipeState.current = { startX: clientX, startY: clientY, deltaX: 0, deltaY: 0 };
		},
		onMove: (_, __, clientX, clientY) => {
			updateSwipeState(closeSwipeState.current, clientX, clientY);
		},
		onEnd: () => {
			const { deltaX, deltaY } = closeSwipeState.current;

			if (enabled && isOpen && isSwipeInDirection(deltaX, deltaY, closeDirection, thresholdPx, directionRatio)) {
				onClose();
			}

			closeSwipeState.current = createSwipeState();
		},
	});

	return {
		openSwipeHandlers: {
			onMouseDown: openTouchHandlers.onMouseDown,
			onPointerDown: openTouchHandlers.onPointerDown,
			onTouchStart: openTouchHandlers.onTouchStart,
		},
		closeSwipeHandlers: {
			onMouseDown: closeTouchHandlers.onMouseDown,
			onPointerDown: closeTouchHandlers.onPointerDown,
			onTouchStart: closeTouchHandlers.onTouchStart,
		},
	};
};

export default useSidebarSwipe;
