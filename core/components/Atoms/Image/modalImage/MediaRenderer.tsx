import { useEffect, forwardRef, MutableRefObject, useRef, CSSProperties, useCallback } from "react";
import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import {
	calculateTransform,
	getCanMoves,
	getClampedValues,
	ZOOM_COUNT,
} from "@components/Atoms/Image/modalImage/utils";
import ObjectRenderer from "@ext/markdown/elements/image/render/components/ObjectRenderer";
import { useTouchHandler } from "@core-ui/hooks/useTouchHandler";

interface ImageProps {
	id: string;
	isClosing: boolean;
	objects: ImageObject[];
	startPos: MutableRefObject<DOMRect>;
	zoomImage: (count: number, mouseX?: number, mouseY?: number) => void;
	src?: string;
	svg?: string;
	className?: string;
	modalStyle?: CSSProperties;
	html?: string | TrustedHTML;
}

const MediaRenderer = forwardRef((props: ImageProps, ref?: MutableRefObject<HTMLImageElement>) => {
	const { id, zoomImage, isClosing, className, src, svg, objects = [], modalStyle, startPos } = props;
	const imgRef = useRef<HTMLImageElement>();

	const onWheel = (event: WheelEvent) => {
		const isCtrl = event.ctrlKey || event.metaKey;
		const target = imgRef.current.parentElement;
		event.preventDefault();

		target.style.transition = "none";
		if (!isCtrl) return moveImage(event);
		zoomImage(event.deltaY, event.clientX, event.clientY);
		target.style.removeProperty("transition");
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

	useEffect(() => {
		const maxScale = () => {
			const container = ref.current;
			const view = container.firstElementChild as HTMLElement;
			const viewRect = view.getBoundingClientRect();
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;
			const maxViewWidth = windowWidth * 0.8;
			const maxViewHeight = windowHeight * 0.8;

			if (view.nodeName !== "DIV" && viewRect.width < maxViewWidth && viewRect.height < maxViewHeight) {
				container.style.scale = "1";
				container.setAttribute("data-scale", "1");
				return;
			}

			const scaleWidth = maxViewWidth / view.offsetWidth;
			const scaleHeight = maxViewHeight / view.offsetHeight;
			const newScale = Math.min(scaleWidth, scaleHeight);

			container.style.scale = `${newScale}`;
			container.setAttribute("data-scale", `${newScale}`);
		};

		const element = document.createElement(svg ? "div" : "img");
		if (src) {
			(element as HTMLImageElement).src = src;
			element.onload = () => maxScale();
		} else {
			(element as HTMLDivElement).innerHTML = svg;
			maxScale();
		}
	}, [src, svg]);

	const moveInImage = () => keyframes`
		0% {
			transform: ${calculateTransform(startPos.current)};
			width: ${startPos.current.width}px;
			height: ${startPos.current.height}px;
		}
		100% {
			transform: scale(1);
			width: ${startPos.current.width}px;
			height: ${startPos.current.height}px;
		}
	`;

	const moveOutImage = () => keyframes`
		0% {
			transform: scale(${parseFloat(ref.current?.style.scale || "1")});
			scale: 1;
			width: ${startPos.current.width}px;
			height: ${startPos.current.height}px;
		}
		100% {
			transform: ${calculateTransform(startPos.current)};
			width: ${startPos.current.width}px;
			height: ${startPos.current.height}px;
		}
	`;

	const AnimatedDiv = styled.div`
		animation: ${() => (!isClosing ? moveInImage() : moveOutImage())} 200ms forwards;
		position: relative;
		width: fit-content;
		height: fit-content;
		display: flex;
		justify-content: center;
		align-items: center;
	`;

	return (
		<div key={src} className={className}>
			<AnimatedDiv data-close="true">
				<div
					ref={ref}
					onPointerDown={onPointerDown}
					onTouchStart={onTouchStart}
					onMouseDown={onMouseDown}
					style={{
						...modalStyle,
						scale: 1,
					}}
					className="image-container"
				>
					{svg ? (
						<div ref={imgRef} id={id} draggable={false} dangerouslySetInnerHTML={{ __html: svg }} />
					) : (
						<img ref={imgRef} id={id} draggable="false" src={src} alt="" />
					)}

					<div className="object-container">
						<ObjectRenderer imageRef={imgRef} objects={objects} editable={false} parentRef={ref} />
					</div>
				</div>
			</AnimatedDiv>
		</div>
	);
});

export default styled(MediaRenderer)`
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	z-index: var(--z-index-article-modal);
	user-select: none;

	.image-container {
		display: flex;
		flex-direction: column;
		position: relative;
		max-width: 90vw;
		max-height: 90vh;
		transition: left 0.2s, top 0.2s, scale 0.2s;
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
