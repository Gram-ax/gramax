import {
	useEffect,
	forwardRef,
	MutableRefObject,
	useRef,
	CSSProperties,
	useCallback,
	memo,
	useLayoutEffect,
	useState,
} from "react";
import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import styled from "@emotion/styled";
import { getCanMoves, getClampedValues, ZOOM_COUNT } from "@components/Atoms/Image/modalImage/utils";
import ObjectRenderer from "@ext/markdown/elements/image/render/components/ObjectRenderer";
import { useTouchHandler } from "@core-ui/hooks/useTouchHandler";
import { useDebounce } from "@core-ui/hooks/useDebounce";

interface ImageProps {
	id: string;
	objects: ImageObject[];
	zoomImage: (count: number, mouseX?: number, mouseY?: number) => void;
	src?: string;
	svg?: string;
	className?: string;
	modalStyle?: CSSProperties;
	html?: string | TrustedHTML;
}

type Rect = {
	left: number;
	top: number;
	scale: number;
};

const MediaRenderer = forwardRef((props: ImageProps, ref?: MutableRefObject<HTMLImageElement>) => {
	const { id, zoomImage, className, src, svg, objects = [], modalStyle } = props;
	const imgRef = useRef<HTMLImageElement>();
	const [rect, setRect] = useState<Rect>();

	const debounceUpdateRect = useDebounce(() => {
		const target = imgRef.current.parentElement;
		if (!target) return;
		setRect({
			left: parseFloat(target.style.left) || 0,
			top: parseFloat(target.style.top) || 0,
			scale: parseFloat(target.style.scale),
		});
	}, 100);

	const onWheel = (event: WheelEvent) => {
		const isCtrl = event.ctrlKey || event.metaKey;
		const target = imgRef.current.parentElement;
		event.preventDefault();

		target.style.transition = "none";
		if (!isCtrl) return moveImage(event);
		zoomImage(event.deltaY, event.clientX, event.clientY);
		target.style.removeProperty("transition");

		if (debounceUpdateRect.timeoutIdRef.current) debounceUpdateRect.cancel();
		debounceUpdateRect.start();
	};

	const moveImage = useCallback((event: WheelEvent) => {
		const target = imgRef.current.parentElement;
		const imgRect = target.getBoundingClientRect();
		target.style.transition = "none";
		const { minWidth, maxWidth, minHeight, maxHeight } = getClampedValues({
			width: imgRect.width,
			height: imgRect.height,
		});

		const { left, right, top, bottom } = getCanMoves(target.getBoundingClientRect());
		const newLeft = (parseFloat(target.style.left) || 0) + -event.deltaX;
		const newTop = (parseFloat(target.style.top) || 0) + -event.deltaY;

		const clampedLeft = Math.min(Math.max(newLeft, minWidth), maxWidth);
		const clampedTop = Math.min(Math.max(newTop, minHeight), maxHeight);

		if (left && right) target.style.left = clampedLeft + "px";
		if (top && bottom) target.style.top = clampedTop + "px";
		target.style.removeProperty("transition");

		if (debounceUpdateRect.timeoutIdRef.current) debounceUpdateRect.cancel();
		debounceUpdateRect.start();
	}, []);

	const onKeyDown = (event: KeyboardEvent) => {
		const isCtrl = event.ctrlKey || event.metaKey;
		if (!isCtrl) return;
		const isZoomIn = event.key === "=";
		const isZoomOut = event.key === "-";

		if (!isZoomIn && !isZoomOut) return;
		zoomImage((isZoomIn && -ZOOM_COUNT) || ZOOM_COUNT);
		event.preventDefault();
	};

	const onStartDrag = useCallback(() => {
		const target = ref.current;
		target.style.transition = "none";
		document.body.style.cursor = "grabbing";
	}, []);

	const onDragMove = useCallback((deltaX: number, deltaY: number) => {
		const target = ref.current;
		const imgRect = target.getBoundingClientRect();
		const { minWidth, maxWidth, minHeight, maxHeight } = getClampedValues({
			width: imgRect.width,
			height: imgRect.height,
		});
		const { left, right, top, bottom } = getCanMoves(imgRect);
		const newLeft = (parseFloat(target.style.left) || 0) + deltaX;
		const newTop = (parseFloat(target.style.top) || 0) + deltaY;

		const clampedLeft = Math.min(Math.max(newLeft, minWidth), maxWidth);
		const clampedTop = Math.min(Math.max(newTop, minHeight), maxHeight);

		if (left && right) target.style.left = clampedLeft + "px";
		if (top && bottom) target.style.top = clampedTop + "px";
	}, []);

	const onDragEnd = useCallback(() => {
		const target = ref.current;
		document.body.style.removeProperty("cursor");
		target.style.removeProperty("transition");

		if (debounceUpdateRect.timeoutIdRef.current) debounceUpdateRect.cancel();
		debounceUpdateRect.start();
	}, []);

	const { onPointerDown, onTouchStart, onMouseDown } = useTouchHandler({
		onStart: onStartDrag,
		onMove: onDragMove,
		onEnd: onDragEnd,
	});

	useEffect(() => {
		window.addEventListener("wheel", onWheel, { passive: false });
		window.addEventListener("keydown", onKeyDown);

		return () => {
			window.removeEventListener("wheel", onWheel);
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [src, svg]);

	useLayoutEffect(() => {
		const maxScale = () => {
			const container = ref.current;
			const view = container.firstElementChild as HTMLElement;
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;
			const maxViewWidth = windowWidth * 0.8;
			const maxViewHeight = windowHeight * 0.8;

			const scaleWidth = maxViewWidth / view.offsetWidth;
			const scaleHeight = maxViewHeight / view.offsetHeight;
			const newScale = Math.min(scaleWidth, scaleHeight);

			container.style.scale = `${newScale}`;
			container.setAttribute("data-scale", `${newScale}`);

			setRect({
				left: parseFloat(container.style.left) || 0,
				top: parseFloat(container.style.top) || 0,
				scale: parseFloat(container.style.scale),
			});
		};

		const element = document.createElement(svg ? "div" : "img");
		if (src) {
			(element as HTMLImageElement).src = src;
			element.onload = () => maxScale();
		} else {
			(element as HTMLDivElement).innerHTML = svg;
			maxScale();
		}

		element.remove();
	}, [src, svg]);

	return (
		<div className={className}>
			<div
				ref={ref}
				onPointerDown={onPointerDown}
				onTouchStart={onTouchStart}
				onMouseDown={onMouseDown}
				style={{
					left: rect?.left,
					top: rect?.top,
					scale: rect?.scale || 1,
					...modalStyle,
				}}
				className="image-container"
			>
				{svg ? (
					<div ref={imgRef} id={id} draggable={false} dangerouslySetInnerHTML={{ __html: svg }} />
				) : (
					<img key={id} ref={imgRef} id={id} draggable="false" src={src} alt="" />
				)}

				<div className="object-container">
					<ObjectRenderer imageRef={imgRef} objects={objects} editable={false} parentRef={ref} />
				</div>
			</div>
		</div>
	);
});

export default styled(memo(MediaRenderer))`
	.image-container {
		display: flex;
		flex-direction: column;
		position: relative;
		max-width: 90vw;
		max-height: 90vh;
		transition: left 0.2s, top 0.2s;
		margin: unset;
	}

	.image-container img,
	.image-container div:first-of-type {
		box-shadow: unset !important;
	}

	.image-container div:first-of-type {
		display: flex;
		justify-content: center;
		align-items: center;
	}
`;
