import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { CSSProperties, MouseEventHandler, MutableRefObject, ReactElement, useCallback, useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import Header from "@components/Atoms/Image/modalImage/Header";
import Image from "@components/Atoms/Image/modalImage/Image";

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

const getLimits = (element: HTMLElement) => {
	const currentHeight = element.offsetHeight;
	const computed = getComputedStyle(element);
	const computedMaxHeight = parseFloat(computed.maxHeight);
	const computedMinHeight = parseFloat(computed.minHeight);

	return {
		max: (computedMaxHeight / currentHeight) * 2,
		min: computedMinHeight / currentHeight,
	};
};

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

		if (mouseX && mouseY) {
			if (newScale < 1) {
				container.style.transition = "left 0.3s ease, top 0.3s ease";
				container.style.left = "0px";
				container.style.top = "0px";
				return;
			}

			container.style.transition = "unset";

			const rect = container.getBoundingClientRect();

			const containerCenterX = rect.left + rect.width / 2;
			const containerCenterY = rect.top + rect.height / 2;

			const offsetX = mouseX - containerCenterX;
			const offsetY = mouseY - containerCenterY;

			const scaleFactor = newScale / previousScale;

			const newOffsetX = offsetX * scaleFactor;
			const newOffsetY = offsetY * scaleFactor;

			const currentLeft = parseFloat(getComputedStyle(container).left) || 0;
			const currentTop = parseFloat(getComputedStyle(container).top) || 0;

			const dx = newOffsetX - offsetX;
			const dy = newOffsetY - offsetY;

			container.style.left = `${currentLeft - dx}px`;
			container.style.top = `${currentTop - dy}px`;
			return;
		}

		container.style.transition = "left 0.3s ease, top 0.3s ease";
		container.style.left = "0px";
		container.style.top = "0px";
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

	> em {
		pointer-events: auto !important;
		position: absolute;
		left: 50%;
		top: 97%;
		color: rgb(123, 124, 125) !important;
		transform: translateX(-50%);
		font-size: 1em !important;
		transition: 0.25s;

		:hover {
			color: var(--color-active-white-hover) !important;
		}
	}

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
`;
