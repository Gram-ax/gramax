import {
	useEffect,
	forwardRef,
	MutableRefObject,
	useRef,
	CSSProperties,
	MouseEvent as ReactMouseEvent,
	useCallback,
} from "react";
import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import {
	calculateTransform,
	getCanMoves,
	getClampedValues,
	ZOOM_COUNT,
} from "@components/Atoms/Image/modalImage/modalFunctions";
import ObjectRenderer from "@ext/markdown/elements/image/render/components/ObjectRenderer";

interface ImageProps {
	id: string;
	isClosing: boolean;
	objects: ImageObject[];
	startPos: DOMRect;
	zoomImage: (count: number, mouseX?: number, mouseY?: number) => void;
	src?: string;
	svg?: string;
	className?: string;
	modalStyle?: CSSProperties;
	html?: string | TrustedHTML;
}

const Image = forwardRef((props: ImageProps, ref?: MutableRefObject<HTMLImageElement>) => {
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

	const onMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();

		const target = event.target as HTMLElement;
		const startX = event.clientX;
		const startY = event.clientY;

		const initialLeft = parseFloat(target.style.left) || 0;
		const initialTop = parseFloat(target.style.top) || 0;

		target.style.transition = "none";
		document.body.style.cursor = "grabbing";

		const imgRect = target.getBoundingClientRect();
		const { minWidth, maxWidth, minHeight, maxHeight } = getClampedValues({
			width: imgRect.width,
			height: imgRect.height,
		});

		const onMouseMove = (moveEvent: MouseEvent) => {
			const { left, right, top, bottom } = getCanMoves(imgRect);
			const newLeft = initialLeft + (moveEvent.clientX - startX);
			const newTop = initialTop + (moveEvent.clientY - startY);

			const clampedLeft = Math.min(Math.max(newLeft, minWidth), maxWidth);
			const clampedTop = Math.min(Math.max(newTop, minHeight), maxHeight);

			if (left && right) target.style.left = clampedLeft + "px";
			if (top && bottom) target.style.top = clampedTop + "px";
		};

		const onMouseUp = () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
			document.body.style.removeProperty("cursor");
			target.style.removeProperty("transition");
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	}, []);

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

			if (view.nodeName !== "DIV" && viewRect.width < windowWidth * 0.3 && viewRect.height < windowHeight * 0.3) {
				container.style.scale = "1";
				container.setAttribute("data-scale", "1");
				return;
			}

			const scaleWidth = ((window.innerWidth / 100) * 80) / view.offsetWidth;
			const scaleHeight = ((window.innerHeight / 100) * 80) / view.offsetHeight;
			const newScale = Math.min(scaleWidth, scaleHeight);

			const minScale = 0.5;
			const finalScale = Math.max(newScale, minScale);

			container.style.scale = `${finalScale}`;
			container.setAttribute("data-scale", `${finalScale}`);
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
		transform: ${calculateTransform(startPos)};
		}
		100% {
		transform: translate3d(1px, 1px, 0);
		}
	`;

	const moveOutImage = () => keyframes`
		0% {
		left: ${ref.current.style.left};
		top: ${ref.current.style.top};
		transform: translate3d(1px, 1px, 0) scale(${ref.current.style.scale});
		}
		100% {
		left: auto;
		top: auto;
		transform: ${calculateTransform(startPos)};
		}
	`;

	const AnimatedDiv = styled.div`
		animation: ${() => (!isClosing ? moveInImage() : moveOutImage())} 200ms forwards;
	`;

	return (
		<div key={src} className={className}>
			<AnimatedDiv data-close="true">
				<div
					ref={ref}
					onMouseDownCapture={onMouseDown}
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

export default styled(Image)`
	position: absolute;
	transform: translate3d(1, 1, 0) scale(1);

	.image-container {
		display: flex;
		flex-direction: column;
		position: relative;
		max-width: 90vw;
		transition: left 0.2s, top 0.2s, scale 0.2s;
		margin: unset;
	}

	.image-container img,
	.image-container div:first-of-type {
		pointer-events: none;
		box-shadow: unset !important;
	}
`;
