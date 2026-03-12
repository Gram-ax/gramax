import { getCanMoves, getClampedValues, ZOOM_COUNT } from "@components/Atoms/Image/modalImage/utils";
import { useMediaScale } from "@components/Atoms/Image/useMediaScale";
import { useDebounce } from "@core-ui/hooks/useDebounce";
import { useTouchHandler } from "@core-ui/hooks/useTouchHandler";
import styled from "@emotion/styled";
import type { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import ObjectRenderer from "@ext/markdown/elements/image/render/components/ObjectRenderer";
import {
	type CSSProperties,
	forwardRef,
	type MutableRefObject,
	memo,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

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

export type Rect = {
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: debounceUpdateRect.timeoutIdRef.current is always defined
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

		if (left && right) target.style.left = `${clampedLeft}px`;
		if (top && bottom) target.style.top = `${clampedTop}px`;
		target.style.removeProperty("transition");

		if (debounceUpdateRect.timeoutIdRef.current) debounceUpdateRect.cancel();
		debounceUpdateRect.start();
	}, []);

	const onKeyDown = useCallback(
		(event: KeyboardEvent) => {
			const isCtrl = event.ctrlKey || event.metaKey;
			if (!isCtrl) return;
			const isZoomIn = event.key === "=";
			const isZoomOut = event.key === "-";

			if (!isZoomIn && !isZoomOut) return;
			zoomImage((isZoomIn && -ZOOM_COUNT) || ZOOM_COUNT);
			event.preventDefault();
		},
		[zoomImage],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: debounce func in useCallback
	const onWheel = useCallback(
		(event: WheelEvent) => {
			const isCtrl = event.ctrlKey || event.metaKey;
			const target = imgRef.current.parentElement;
			event.preventDefault();

			target.style.transition = "none";
			if (!isCtrl) return moveImage(event);
			zoomImage(event.deltaY, event.clientX, event.clientY);
			target.style.removeProperty("transition");

			if (debounceUpdateRect.timeoutIdRef.current) debounceUpdateRect.cancel();
			debounceUpdateRect.start();
		},
		[moveImage, zoomImage],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: is a ref
	const onStartDrag = useCallback(() => {
		const target = ref.current;
		target.style.transition = "none";
		document.body.style.cursor = "grabbing";
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: is a ref
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

		if (left && right) target.style.left = `${clampedLeft}px`;
		if (top && bottom) target.style.top = `${clampedTop}px`;
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: debounce func in useCallback
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: src and svg are dependencies
	useEffect(() => {
		window.addEventListener("wheel", onWheel, { passive: false });
		window.addEventListener("keydown", onKeyDown);

		return () => {
			window.removeEventListener("wheel", onWheel);
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [src, svg]);

	useMediaScale({ ref, src, svg, onReady: setRect });

	return (
		<div className={className}>
			<div
				className="image-container"
				onMouseDown={onMouseDown}
				onPointerDown={onPointerDown}
				onTouchStart={onTouchStart}
				ref={ref}
				style={{
					left: rect?.left,
					top: rect?.top,
					scale: rect?.scale || 1,
					...modalStyle,
				}}
			>
				{svg ? (
					<div dangerouslySetInnerHTML={{ __html: svg }} draggable={false} id={id} ref={imgRef} />
				) : (
					<img alt="" draggable="false" id={id} key={id} ref={imgRef} src={src} />
				)}

				<div className="object-container">
					<ObjectRenderer editable={false} imageRef={imgRef} objects={objects} parentRef={ref} />
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
	.image-container div:first-of-type svg {
		box-shadow: unset !important;
		max-width: ${(p) =>
			`calc(90vw - ${p.modalStyle?.paddingLeft || p.modalStyle?.padding || "0px"} - ${
				p.modalStyle?.paddingLeft || p.modalStyle?.padding || "0px"
			})`};
		max-height: ${(p) =>
			`calc(90vh - ${p.modalStyle?.paddingTop || p.modalStyle?.padding || "0px"} - ${
				p.modalStyle?.paddingBottom || p.modalStyle?.padding || "0px"
			})`};
	}

	.image-container div:first-of-type svg {
		width: auto !important;
		height: auto !important;
	}

	.image-container div:first-of-type {
		display: flex;
		justify-content: center;
		align-items: center;
	}
`;
