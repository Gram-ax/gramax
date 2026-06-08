import Header from "@components/Atoms/Image/modalImage/Header";
import { MediaAnimation } from "@components/Atoms/Image/modalImage/MediaAnimation";
import MediaRenderer from "@components/Atoms/Image/modalImage/MediaRenderer";
import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import { cn } from "@core-ui/utils/cn";
import type { ArticleProviderType } from "@ext/articleProvider/logic/ArticleProvider";
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
	resourceId?: string;
	resourceProvider?: ArticleProviderType;
	title?: string;
	objects?: ImageObject[];
	className?: string;
	modalStyle?: CSSProperties;
	modalEdit?: () => void;
}

const MediaPreview = (props: MediaPreviewProps): ReactElement => {
	const {
		id,
		className,
		objects,
		src,
		svg,
		downloadSrc,
		resourceId,
		resourceProvider,
		modalStyle,
		modalEdit,
		title,
		onClose,
	} = props;

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
		<div
			className={cn(
				"static flex justify-center items-center pointer-events-auto w-screen h-screen left-0 top-0 z-[var(--z-index-overlay)]",
				className,
			)}
			data-qa={DATA_QA_LIGHTBOX}
			key={downloadSrc}
			onClick={onModalClick}
		>
			<Overlay
				className={cn(
					"modal-background z-[var(--z-index-overlay)] transition-opacity duration-200",
					{
						"data-open opacity-100 pointer-events-auto": !isClosing,
						"data-closed opacity-0 pointer-events-none": isClosing,
					},
					"data-close",
				)}
				data-state={isClosing ? "closed" : "open"}
			/>
			<Header
				downloadSrc={downloadSrc}
				isClosing={isClosing}
				modalEdit={modalEdit}
				onClose={closeModal}
				resourceId={resourceId}
				resourceProvider={resourceProvider}
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

export default memo(MediaPreview);
