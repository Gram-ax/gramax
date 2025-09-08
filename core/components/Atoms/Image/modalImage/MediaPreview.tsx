import Header from "@components/Atoms/Image/modalImage/Header";
import MediaRenderer from "@components/Atoms/Image/modalImage/MediaRenderer";
import { getCanMoves, getClampedValues, getLimits } from "@components/Atoms/Image/modalImage/utils";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { Overlay } from "@ui-kit/Overlay";
import {
	CSSProperties,
	memo,
	MouseEventHandler,
	MutableRefObject,
	ReactElement,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

export const DATA_QA_LIGHTBOX = "qa-lightbox";

interface MediaPreviewProps {
	id: string;
	src?: string;
	svg?: string;
	openedElement: MutableRefObject<HTMLImageElement | HTMLDivElement>;
	onClose: () => void;
	downloadSrc?: string;
	title?: string;
	objects?: ImageObject[];
	className?: string;
	modalStyle?: CSSProperties;
	modalEdit?: () => void;
}

const MediaPreview = (props: MediaPreviewProps): ReactElement => {
	const { id, className, objects, src, svg, downloadSrc, openedElement, modalStyle, modalEdit, title, onClose } =
		props;
	const containerRef = useRef<HTMLImageElement>();
	const mainContainerRef = useRef<HTMLDivElement>();
	const startRectRef = useRef<DOMRect>(openedElement.current?.getBoundingClientRect());
	const [isClosing, setClosing] = useState<boolean>(false);

	const closeModal = useCallback(
		(immediately?: boolean) => {
			if (immediately) return onClose();
			setClosing(true);
			setTimeout(() => {
				onClose?.();
			}, 200);
		},
		[onClose],
	);

	const onClick: MouseEventHandler<HTMLDivElement> = useCallback(
		(event) => {
			const target = event.target as HTMLElement;
			if (target.classList.contains("data-close")) return closeModal();
			if (!mainContainerRef.current.contains(target)) event.stopPropagation();
		},
		[mainContainerRef.current, closeModal],
	);

	const onKeyDown = useCallback(
		(ev: KeyboardEvent) => {
			if (ev.key === "Escape") closeModal();
		},
		[closeModal],
	);

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
	}, [src, svg]);

	useEffect(() => {
		const onResize = () => {
			startRectRef.current = openedElement.current?.getBoundingClientRect();
		};

		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [openedElement.current]);

	return (
		<div
			key={downloadSrc}
			ref={mainContainerRef}
			data-qa={DATA_QA_LIGHTBOX}
			className={className}
			onClick={onClick}
		>
			<Overlay
				data-state={isClosing ? "closed" : "open"}
				className={classNames(
					"modal-background",
					{
						"data-open": !isClosing,
						"data-closed": isClosing,
					},
					["data-close"],
				)}
			/>
			<Header
				modalEdit={modalEdit}
				zoomImage={zoomImage}
				onClose={closeModal}
				downloadSrc={downloadSrc}
				isClosing={isClosing}
			/>
			<MediaRenderer
				zoomImage={zoomImage}
				ref={containerRef}
				id={id}
				src={src}
				svg={svg}
				isClosing={isClosing}
				objects={objects}
				startPos={startRectRef}
				modalStyle={modalStyle}
			/>
			{title && <em>{title}</em>}
		</div>
	);
};

export default styled(memo(MediaPreview))`
	z-index: var(--z-index-article-modal);
	position: static;
	display: flex;
	justify-content: center;
	align-items: center;
	pointer-events: auto;
	width: 100vw;
	height: 100vh;
	left: 0;
	top: 0;

	.modal-background {
		z-index: var(--z-index-article-modal);
	}

	.data-open {
		animation: open 200ms forwards;
	}

	.data-closed {
		animation: close 200ms forwards;
	}

	@keyframes open {
		0% {
			opacity: 0;
			pointer-events: none;
		}
		100% {
			opacity: 1;
			pointer-events: auto;
		}
	}

	@keyframes close {
		0% {
			opacity: 1;
			pointer-events: auto;
		}
		100% {
			opacity: 0;
			pointer-events: none;
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
		z-index: var(--z-index-article-modal);
	}
`;
