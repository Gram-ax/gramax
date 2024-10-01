import Header from "@components/Atoms/Image/modalImage/Header";
import Image from "@components/Atoms/Image/modalImage/Image";
import { getCanMoves, getClampedValues, getLimits } from "@components/Atoms/Image/modalImage/modalFunctions";
import styled from "@emotion/styled";
import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import {
	CSSProperties,
	MouseEventHandler,
	MutableRefObject,
	ReactElement,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

interface LightboxProps {
	id: string;
	src: string;
	openedElement: MutableRefObject<HTMLImageElement | HTMLDivElement>;
	onClose: () => void;
	downloadSrc?: string;
	title?: string;
	objects?: ImageObject[];
	className?: string;
	modalStyle?: CSSProperties;
	modalEdit?: () => void;
}

const Lightbox = (props: LightboxProps): ReactElement => {
	const { id, className, objects, src, downloadSrc, openedElement, modalStyle, modalEdit, title, onClose } = props;
	const containerRef = useRef<HTMLImageElement>();
	const mainContainerRef = useRef<HTMLDivElement>();
	const [isClosing, setClosing] = useState<boolean>(false);

	const closeModal = (immediately?: boolean) => {
		if (immediately) return onClose();
		setClosing(true);
		setTimeout(() => {
			onClose?.();
		}, 200);
	};

	const onClick: MouseEventHandler<HTMLDivElement> = (event) => {
		const target = event.target as HTMLElement;
		if (target.getAttribute("data-close")) return closeModal();
		if (!mainContainerRef.current.contains(target)) event.stopPropagation();
	};

	const onKeyDown = (ev: KeyboardEvent) => {
		if (ev.key === "Escape") closeModal();
	};

	const zoomImage = useCallback((deltaY: number, mouseX?: number, mouseY?: number) => {
		const container = containerRef.current;
		const delta = Math.min(Math.max(deltaY, -25), 25);

		const { max, min } = getLimits(container);
		const previousScale = +container.style.scale || 1;
		const newScale = Math.min(Math.max(previousScale - delta * 0.01, min || 0.25), max || 1.7);
		container.style.scale = newScale.toString();

		if (!mouseX || !mouseY) return;

		const rect = container.getBoundingClientRect();
		const { left, right, top, bottom } = getCanMoves(rect);
		const scaleFactor = newScale / previousScale;

		if (left && right) {
			const containerCenterX = rect.left + rect.width / 2;
			const offsetX = deltaY < 0 ? mouseX - containerCenterX : 0;
			const newOffsetX = offsetX * scaleFactor;
			const currentLeft = parseFloat(getComputedStyle(container).left) || 0;
			const dx = newOffsetX - offsetX;
			container.style.left = `${currentLeft - dx}px`;
		}

		if (top && bottom) {
			const containerCenterY = rect.top + rect.height / 2;
			const offsetY = deltaY < 0 ? mouseY - containerCenterY : 0;
			const newOffsetY = offsetY * scaleFactor;
			const currentTop = parseFloat(getComputedStyle(container).top) || 0;
			const dy = newOffsetY - offsetY;
			container.style.top = `${currentTop - dy}px`;
		}
		const { minWidth, maxWidth, minHeight, maxHeight } = getClampedValues({
			width: rect.width,
			height: rect.height,
		});

		if (left && !right) container.style.left = `${minWidth}px`;
		if (!left && right) container.style.left = `${maxWidth}px`;
		if (top && !bottom) container.style.top = `${minHeight}px`;
		if (!top && bottom) container.style.top = `${maxHeight}px`;
	}, []);

	useEffect(() => {
		window.addEventListener("keydown", onKeyDown);

		return () => {
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [src]);

	return (
		<div
			key={downloadSrc}
			ref={mainContainerRef}
			data-close="true"
			className={className}
			style={{ animation: isClosing ? "close 200ms forwards" : "open 200ms forwards" }}
			onClick={onClick}
		>
			<Header modalEdit={modalEdit} zoomImage={zoomImage} onClose={closeModal} downloadSrc={downloadSrc} />
			<Image
				zoomImage={zoomImage}
				ref={containerRef}
				id={id}
				src={src}
				isClosing={isClosing}
				objects={objects}
				startPos={openedElement.current.getBoundingClientRect()}
				modalStyle={modalStyle}
			/>
			{title && <em>{title}</em>}
		</div>
	);
};

export default styled(Lightbox)`
	z-index: 200;
	position: fixed;
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100vw;
	height: 100vh;
	left: 0;
	top: 0;
	opacity: 0;
	background-color: var(--color-modal-overlay-style-bg);

	@keyframes open {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}

	@keyframes close {
		0% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	em {
		position: absolute;
		bottom: 5%;
		left: 50%;
		transform: translateX(-50%);
		text-align: center;
		margin-top: 1em;
		color: var(--color-active-white) !important;
		font-size: 1em !important;
	}
`;
