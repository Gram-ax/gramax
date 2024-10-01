import {
	useEffect,
	forwardRef,
	MutableRefObject,
	useRef,
	CSSProperties,
	MouseEvent as ReactMouseEvent,
	useCallback,
} from "react";
import UnifiedComponent from "@ext/markdown/elements/image/render/components/ImageEditor/Unified";
import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { calculateTransform, getCanMoves, getClampedValues } from "@components/Atoms/Image/modalImage/modalFunctions";

interface ImageProps {
	id: string;
	src: string;
	isClosing: boolean;
	objects: ImageObject[];
	startPos: DOMRect;
	zoomImage: (count: number, mouseX?: number, mouseY?: number) => void;
	className?: string;
	modalStyle?: CSSProperties;
	html?: string | TrustedHTML;
}

const Image = forwardRef((props: ImageProps, ref?: MutableRefObject<HTMLImageElement>) => {
	const { id, zoomImage, isClosing, className, src, objects = [], modalStyle, startPos } = props;
	const parentRef = useRef<HTMLDivElement>();
	const imgRef = useRef<HTMLImageElement>();

	const onWheel = (event: WheelEvent) => {
		const isCtrl = event.ctrlKey || event.metaKey;
		event.preventDefault();

		if (!isCtrl) return moveImage(event);
		zoomImage(event.deltaY, event.clientX, event.clientY);
	};

	const moveImage = useCallback((event: WheelEvent) => {
		const target = imgRef.current.parentElement;
		const imgRect = target.getBoundingClientRect();
		const { minWidth, maxWidth, minHeight, maxHeight } = getClampedValues({
			width: imgRect.width,
			height: imgRect.height,
		});

		const { left, right, top, bottom } = getCanMoves(target.getBoundingClientRect());
		const newLeft = parseFloat(target.style.left) + -event.deltaX;
		const newTop = parseFloat(target.style.top) + -event.deltaY;

		const clampedLeft = Math.min(Math.max(newLeft, minWidth), maxWidth);
		const clampedTop = Math.min(Math.max(newTop, minHeight), maxHeight);

		if (left && right) target.style.left = clampedLeft + "px";
		if (top && bottom) target.style.top = clampedTop + "px";
	}, []);

	const onKeyDown = (event: KeyboardEvent) => {
		const isCtrl = event.ctrlKey || event.metaKey;
		if (!isCtrl) return;
		const isZoomIn = event.key === "=";
		const isZoomOut = event.key === "-";

		if (!isZoomIn && !isZoomOut) return;
		zoomImage((isZoomIn && -20) || 20);
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
	}, [src]);

	useEffect(() => {
		const image = document.createElement("img");
		image.src = src;
		image.onload = () => {
			const container = ref.current;
			const scaleWidth = ((window.innerWidth / 100) * 80) / container.offsetWidth;
			const scaleHeight = ((window.innerHeight / 100) * 80) / container.offsetHeight;
			const newScale = scaleWidth < scaleHeight ? scaleWidth : scaleHeight;

			container.style.scale = `${newScale}`;
			container.setAttribute("data-scale", `${newScale}`);
			image.remove();
		};
	}, []);

	const moveInImage = () => keyframes`
		0% {
		transform: ${calculateTransform(startPos, window.innerWidth, window.innerHeight)};
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
		transform: ${calculateTransform(startPos, window.innerWidth, window.innerHeight)};
		}
	`;

	const AnimatedDiv = styled.div`
		animation: ${() => (!isClosing ? moveInImage() : moveOutImage())} 200ms forwards;
	`;

	return (
		<div key={src} className={className}>
			<AnimatedDiv data-close="true" className="image__container">
				<div
					ref={ref}
					onMouseDownCapture={onMouseDown}
					style={{
						...modalStyle,
						scale: 1,
					}}
					className="object__container"
				>
					<img ref={imgRef} id={id} draggable="false" src={src} alt="" />

					{objects.length > 0 && (
						<div ref={parentRef}>
							{objects.map((data, index) => (
								<UnifiedComponent
									parentRef={parentRef}
									key={index}
									index={index}
									{...data}
									editable={false}
									type={data.type}
									drawIndexes={objects.length > 1}
								/>
							))}
						</div>
					)}
				</div>
			</AnimatedDiv>
		</div>
	);
});

export default styled(Image)`
	position: absolute;
	transform: translate3d(1, 1, 0) scale(1);

	.object__container {
		display: flex;
		flex-direction: column;
		position: relative;
		max-width: 90vw;
		transition: left 0.2s, top 0.2s, scale 0.2s;
	}

	.object__container img {
		pointer-events: none;
		box-shadow: unset !important;
	}
`;
