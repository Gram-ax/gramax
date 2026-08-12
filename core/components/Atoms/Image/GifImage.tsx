import Caption from "@components/Atoms/Caption";
import type MediaPreview from "@components/Atoms/Image/modalImage/MediaPreview";
import PlayButton from "@components/Atoms/Image/PlayButton";
import ImageSkeleton from "@components/Atoms/ImageSkeleton";
import HoverableActions from "@components/controls/HoverController/HoverableActions";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import { cn } from "@core-ui/utils/cn";
import getAdjustedSize from "@core-ui/utils/getAdjustedSize";
import {
	type ComponentProps,
	type MouseEvent,
	memo,
	type ReactEventHandler,
	type ReactNode,
	type RefObject,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

interface GifImageProps {
	src: string;
	alt?: string;
	title?: string;
	className?: string;
	noplay?: boolean;
	onError?: ReactEventHandler<HTMLImageElement>;
	onLoad?: () => void;
	hoverElementRef?: RefObject<HTMLDivElement>;
	setIsHovered?: (isHovered: boolean) => void;
	isHovered?: boolean;
	rightActions?: ReactNode;
	width?: string;
	height?: string;
	realSrc?: string;
}

const GifImage = (props: GifImageProps) => {
	const {
		src,
		alt,
		title,
		className,
		noplay,
		onError,
		onLoad,
		hoverElementRef,
		setIsHovered,
		isHovered,
		rightActions,
		width,
		height,
		realSrc,
	} = props;
	const containerRef = useRef<HTMLDivElement>();
	const gifRef = useRef<HTMLImageElement>();
	const buttonRef = useRef<HTMLElement>();
	const canvasRef = useRef<HTMLCanvasElement>();
	const articleRef = ArticleRefService.value;
	const { id: resourceId, provider: resourceProvider } = ResourceService.value;

	const [isPlaying, setIsplaying] = useState(!noplay);
	const [thumbnail, setThumbnail] = useState<string>(null);
	const [size, setSize] = useState(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected, because is ref
	useLayoutEffect(() => {
		if (!width?.endsWith("px")) return;
		const parentWidth =
			containerRef.current?.clientWidth || articleRef.current?.firstElementChild?.firstElementChild?.clientWidth;

		if (!parentWidth) return;
		const newWidth = parseFloat(width);
		const newHeight = parseFloat(height);
		const newSize = getAdjustedSize(newWidth, newHeight, parentWidth);

		setSize({
			width: `${newSize.width}px`,
			height: `${newSize.height}px`,
		});
	}, [width, height]);

	const onImageClick = useCallback(() => {
		if (noplay) return;
		setIsplaying(false);
	}, [noplay]);

	const onPlayButtonClick = useCallback(() => {
		if (noplay) return;
		setIsplaying(true);
	}, [noplay]);

	const onDoubleClick = useCallback(
		(event: MouseEvent<HTMLDivElement>) => {
			event.stopPropagation();
			ModalToOpenService.setValue<ComponentProps<typeof MediaPreview>>(ModalToOpen.MediaPreview, {
				id: realSrc,
				src: src,
				title: title,
				downloadSrc: realSrc,
				resourceId,
				resourceProvider,
				openedElement: gifRef,
				onClose: () => {
					ModalToOpenService.resetValue();
				},
			});
		},
		[src, title, realSrc, resourceId, resourceProvider],
	);

	const preOnLoad = useCallback(() => {
		const canvas = canvasRef.current;
		const gif = gifRef.current;

		if (!thumbnail) {
			canvas.width = gif?.width;
			canvas.height = gif?.height;
			canvas.getContext("2d").drawImage(gif, 0, 0, canvas.width, canvas.height);

			canvas.toBlob((blob) => {
				setThumbnail(URL.createObjectURL(blob));
			});
		}

		onLoad?.();
	}, [onLoad, thumbnail]);

	return (
		<div className={cn("flex justify-center my-[0.5em] mx-auto", className)}>
			<div>
				<div
					className={cn("ff-container relative", {
						"ff-active": isPlaying,
						"ff-inactive": !isPlaying,
					})}
					onDoubleClick={onDoubleClick}
				>
					<HoverableActions
						hoverElementRef={hoverElementRef}
						isHovered={isHovered}
						rightActions={rightActions}
						setIsHovered={setIsHovered}
					>
						<ImageSkeleton height={size?.height} isLoaded={!!thumbnail} width={size?.width}>
							<PlayButton
								className={cn("ff-button absolute inset-0", { hidden: isPlaying })}
								onClick={onPlayButtonClick}
								ref={buttonRef}
							/>
							<canvas
								className={cn("ff-canvas absolute w-full h-full select-none", {
									"!hidden": isPlaying,
								})}
								data-focusable="true"
								ref={canvasRef}
							/>
							<div
								className={cn("ff-gif rounded-[var(--radius-small)]", {
									"z-[var(--z-index-background)]": !isPlaying,
								})}
								data-focusable={true}
								onClick={onImageClick}
							>
								<img
									alt={alt}
									className="select-none pointer-events-none"
									onError={onError}
									onLoad={preOnLoad}
									ref={gifRef}
									src={isPlaying || !thumbnail ? src : thumbnail}
								/>
							</div>
						</ImageSkeleton>
					</HoverableActions>
				</div>
				{title && <Caption className="!mt-[0.5em]">{title}</Caption>}
			</div>
		</div>
	);
};
export default memo(GifImage);
