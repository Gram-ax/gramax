import Lightbox from "@components/Atoms/Image/modalImage/Lightbox";
import PlayButton from "@components/Atoms/Image/PlayButton";
import ImageSkeleton from "@components/Atoms/ImageSkeleton";
import HoverableActions from "@components/controls/HoverController/HoverableActions";
import { classNames } from "@components/libs/classNames";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import getAdjustedSize from "@core-ui/utils/getAdjustedSize";
import styled from "@emotion/styled";
import React, { memo, ReactEventHandler, ReactNode, useCallback, useLayoutEffect, useRef, useState } from "react";

interface GifImageProps {
	src: string;
	alt?: string;
	title?: string;
	className?: string;
	noplay?: boolean;
	onError?: ReactEventHandler<HTMLImageElement>;
	onLoad?: () => void;
	hoverElementRef?: React.RefObject<HTMLDivElement>;
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
	const [isOpen, setIsOpen] = useState(false);
	const [thumbnail, setThumbnail] = useState<string>(null);
	const [size, setSize] = useState(null);

	useLayoutEffect(() => {
		if (!width?.endsWith("px")) return;
		const parentWidth =
			containerRef.current?.clientWidth || articleRef.current?.firstElementChild?.firstElementChild?.clientWidth;

		if (!parentWidth) return;
		const newWidth = parseFloat(width);
		const newHeight = parseFloat(height);
		const newSize = getAdjustedSize(newWidth, newHeight, parentWidth);

		setSize({
			width: newSize.width + "px",
			height: newSize.height + "px",
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

	const onClose = useCallback(() => {
		setIsOpen(false);
	}, []);

	const onDoubleClick = useCallback(() => {
		setIsOpen(true);
	}, []);

	const preOnLoad = useCallback(() => {
		const canvas = canvasRef.current;
		const gif = gifRef.current;

		if (!thumbnail) {
			const w = (canvas.width = gif.width);
			const h = (canvas.height = gif.height);
			canvas.getContext("2d").drawImage(gif, 0, 0, w, h);

			canvas.toBlob((blob) => {
				setThumbnail(URL.createObjectURL(blob));
			});
		}

		onLoad?.();
	}, [onLoad, thumbnail]);

	return (
		<div className={className}>
			<span className="lightbox">
				{isOpen && (
					<Lightbox
						id={realSrc}
						src={src}
						title={title}
						downloadSrc={realSrc}
						onClose={onClose}
						openedElement={gifRef}
					/>
				)}
			</span>
			<div
				onDoubleClickCapture={onDoubleClick}
				className={classNames("ff-container", { "ff-active": isPlaying, "ff-inactive": !isPlaying })}
			>
				<HoverableActions
					hoverElementRef={hoverElementRef}
					isHovered={isHovered}
					setIsHovered={setIsHovered}
					rightActions={rightActions}
				>
					<ImageSkeleton width={size?.width} height={size?.height} isLoaded={!!thumbnail}>
						<PlayButton onClick={onPlayButtonClick} ref={buttonRef} className="ff-button" />
						<canvas className="ff-canvas" ref={canvasRef} data-focusable="true" />
						<div className="ff-gif" data-focusable={true} onClick={onImageClick}>
							<img
								src={(!thumbnail && !isPlaying) || (isPlaying && thumbnail) ? src : thumbnail}
								alt={alt}
								onLoad={preOnLoad}
								ref={gifRef}
								onError={onError}
							/>
						</div>
					</ImageSkeleton>
					{title && <em>{title}</em>}
				</HoverableActions>
			</div>
		</div>
	);
};
export default styled(memo(GifImage))`
	display: flex;
	justify-content: center;
	margin: 0.5em auto 0.5em auto !important;

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
		display: inline-block;
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
			z-index: var(--z-index-base);
			color: var(--color-white);
			cursor: pointer;
			max-width: 5.875em;
			max-height: 5.875em;
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
