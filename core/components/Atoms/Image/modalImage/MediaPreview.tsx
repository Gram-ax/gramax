import Header from "@components/Atoms/Image/modalImage/Header";
import { MediaAnimation } from "@components/Atoms/Image/modalImage/MediaAnimation";
import MediaRenderer from "@components/Atoms/Image/modalImage/MediaRenderer";
import { classNames } from "@components/libs/classNames";
import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import styled from "@emotion/styled";
import type { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { Overlay } from "@ui-kit/Overlay";
import {
	type CSSProperties,
	type MouseEvent,
	type MutableRefObject,
	memo,
	type ReactElement,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { type ReactZoomPanPinchRef, TransformWrapper } from "react-zoom-pan-pinch";
import { MediaDescription } from "./MediaDescription";

export const DATA_QA_LIGHTBOX = "qa-lightbox";

interface MediaPreviewProps {
	id: string;
	src?: string;
	svg?: string;
	openedElement?: MutableRefObject<HTMLElement>;
	onClose: () => void;
	downloadSrc?: string;
	title?: string;
	objects?: ImageObject[];
	className?: string;
	modalStyle?: CSSProperties;
	modalEdit?: () => void;
}

const MediaPreview = (props: MediaPreviewProps): ReactElement => {
	const { id, className, objects, src, svg, downloadSrc, modalStyle, modalEdit, title, onClose } = props;

	const transformRef = useRef<ReactZoomPanPinchRef>();
	const [isClosing, setClosing] = useState<boolean>(false);

	const breakpoint = useBreakpoint();

	const closeModal = useCallback(
		(immediately?: boolean) => {
			if (immediately) return onClose();
			setClosing(true);
			onClose?.();
		},
		[onClose],
	);

	const onKeyDown = useCallback(
		(ev: KeyboardEvent) => {
			if (ev.key === "Escape") closeModal();
		},
		[closeModal],
	);

	const zoomImage = useCallback((direction: number) => {
		if (direction < 0) {
			transformRef.current?.zoomIn(0.3);
		} else {
			transformRef.current?.zoomOut(0.3);
		}
	}, []);

	useEffect(() => {
		window.addEventListener("keydown", onKeyDown);

		return () => {
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [onKeyDown]);

	const onModalClick = useCallback(
		(event: MouseEvent<HTMLDivElement>) => {
			const target = event.target as HTMLElement;
			if (!target.classList.contains("transform-wrapper")) return;
			closeModal();
		},
		[closeModal],
	);

	return (
		<div className={className} data-qa={DATA_QA_LIGHTBOX} key={downloadSrc} onClick={onModalClick}>
			<Overlay
				className={classNames(
					"modal-background",
					{
						"data-open": !isClosing,
						"data-closed": isClosing,
					},
					["data-close"],
				)}
				data-state={isClosing ? "closed" : "open"}
			/>
			<Header
				downloadSrc={downloadSrc}
				isClosing={isClosing}
				modalEdit={modalEdit}
				onClose={closeModal}
				zoomImage={zoomImage}
			/>
			<TransformWrapper
				centerOnInit
				doubleClick={{ mode: "reset" }}
				initialScale={breakpoint === "sm" ? 1 : 0.8}
				maxScale={3}
				minScale={0.25}
				panning={{ velocityDisabled: false }}
				ref={transformRef}
			>
				<MediaAnimation isClosing={isClosing}>
					<MediaRenderer id={id} modalStyle={modalStyle} objects={objects} src={src} svg={svg} />
				</MediaAnimation>
			</TransformWrapper>
			{title && <MediaDescription>{title}</MediaDescription>}
		</div>
	);
};

export default styled(memo(MediaPreview))`
	z-index: var(--z-index-overlay);
	position: static;
	display: flex;
	justify-content: center;
	align-items: center;
	pointer-events: auto;
	width: 100vw;
	height: 100vh;
	left: 0;
	top: 0;

	.react-transform-wrapper {
		width: 100% !important;
		height: 100% !important;
		position: absolute !important;
		top: 0;
		left: 0;
	}

	.modal-background {
		z-index: var(--z-index-overlay);
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
`;
