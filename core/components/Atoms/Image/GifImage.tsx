import Caption from "@components/Atoms/Caption";
import type MediaPreview from "@components/Atoms/Image/modalImage/MediaPreview";
import PlayButton from "@components/Atoms/Image/PlayButton";
import ImageSkeleton from "@components/Atoms/ImageSkeleton";
import HoverableActions from "@components/controls/HoverController/HoverableActions";
import { classNames } from "@components/libs/classNames";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import getAdjustedSize from "@core-ui/utils/getAdjustedSize";
import styled from "@emotion/styled";
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

	const [isPlaying, setIsplaying] = useState(false);
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
				openedElement: gifRef,
				onClose: () => {
					ModalToOpenService.resetValue();
				},
			});
		},
		[src, title, realSrc],
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
		<div className={className}>
			<div>
				<div
					className={classNames("ff-container", { "ff-active": isPlaying, "ff-inactive": !isPlaying })}
					onDoubleClick={onDoubleClick}
				>
					<HoverableActions
						hoverElementRef={hoverElementRef}
						isHovered={isHovered}
						rightActions={rightActions}
						setIsHovered={setIsHovered}
					>
						<ImageSkeleton height={size?.height} isLoaded={!!thumbnail} width={size?.width}>
							<PlayButton className="ff-button" onClick={onPlayButtonClick} ref={buttonRef} />
							<canvas className="ff-canvas" data-focusable="true" ref={canvasRef} />
							<div className="ff-gif" data-focusable={true} onClick={onImageClick}>
								<img
									alt={alt}
									onError={onError}
									onLoad={preOnLoad}
									ref={gifRef}
									src={(!thumbnail && !isPlaying) || (isPlaying && thumbnail) ? src : thumbnail}
								/>
							</div>
						</ImageSkeleton>
					</HoverableActions>
				</div>
				{title && <Caption>{title}</Caption>}
			</div>
		</div>
	);
};
export default styled(memo(GifImage))`
	display: flex;
	justify-content: center;
	margin: 0.5em auto;

	img {
		user-select: none;
		pointer-events: none;
	}

	em {
		margin-top: 0.5em !important;
	}

	.ff-active {
		.ff-canvas {
			display: none;
		}
		.ff-button {
			display: none;
		}
	}
	.ff-inactive .ff-gif {
		z-index: var(--z-index-background);
	}

	.ff-gif {
		border-radius: var(--radius-small);
	}

	.ff-container {
		position: relative;

		.ff-canvas {
			position: absolute;
			width: 100%;
			height: 100%;
			user-select: none;
		}

		.ff-button {
			position: absolute;
			top: 0%;
			left: 0%;
			right: 0%;
			bottom: 0%;
		}

		.ff-button svg {
			position: absolute;
			top: 0%;
			left: 0%;
			right: 0%;
			bottom: 0%;
			margin: auto;
			z-index: var(--z-index-foreground);
			color: var(--color-white);
			cursor: pointer;
			height: min(5em, 70%);
			width: auto;
			background-size: contain;
			background-position: center;
			background-repeat: no-repeat;
			-moz-background-size: contain;
			-webkit-background-size: contain;
			filter: drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.7));
			margin-top: auto !important;
		}
	}
`;
