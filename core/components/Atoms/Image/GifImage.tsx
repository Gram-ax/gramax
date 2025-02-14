import PlayButton from "@components/Atoms/Image/PlayButton";
import HoverableActions from "@components/controls/HoverController/HoverableActions";
import styled from "@emotion/styled";
import React, { ReactEventHandler, ReactNode, useEffect, useRef, useState } from "react";

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
}

const GifImage = (props: GifImageProps) => {
	const { src, alt, title, className, noplay, onError, onLoad, hoverElementRef, setIsHovered, isHovered, rightActions } =
		props;
	const gif = useRef<HTMLImageElement>();
	const button = useRef<SVGSVGElement>();
	const canvas = useRef<HTMLCanvasElement>();
	const [isPlaying, setIsplaying] = useState(false);

	useEffect(() => {
		if (!gif?.current || !button?.current) return;
		fetch(src)
			.then((r) => r.blob())
			.then(() => {
				if (noplay) return;

				if (gif?.current)
					gif.current.onclick = () => {
						setIsplaying(false);
					};

				if (button?.current)
					button.current.onclick = () => {
						setIsplaying(true);
					};
			});
	}, [gif?.current, button?.current]);

	return (
		<div className={className}>
			<HoverableActions
				hoverElementRef={hoverElementRef}
				isHovered={isHovered}
				setIsHovered={setIsHovered}
				rightActions={rightActions}
			>
				<div className={"ff-container ff-" + (isPlaying ? "active" : "inactive")}>
					<PlayButton ref={button} className="ff-button" />
					<canvas className="ff-canvas" ref={canvas} data-focusable="true" />
					<img
						onError={onError}
						src={src}
						data-focusable="true"
						className="ff-gif"
						alt={alt}
						ref={gif}
						onLoad={() => {
							const w = (canvas.current.width = gif.current.width);
							const h = (canvas.current.height = gif.current.height);
							canvas.current.getContext("2d").drawImage(gif.current, 0, 0, w, h);
							onLoad?.();
						}}
					/>
					{title && <em>{title}</em>}
				</div>
			</HoverableActions>
		</div>
	);
};
export default styled(GifImage)`
	display: flex;
	justify-content: center;
	margin: 0.5em auto 0.5em auto !important;

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

	.ff-container {
		display: inline-block;
		position: relative;

		.ff-canvas {
			position: absolute;
			width: 100%;
			height: 100%;
		}

		.ff-button {
			top: 0%;
			left: 0%;
			right: 0%;
			bottom: 0%;
			margin: auto;
			z-index: var(--z-index-base);
			cursor: pointer;
			max-width: 5.875em;
			max-height: 5.875em;
			position: absolute;
			background-size: contain;
			background-position: center;
			background-repeat: no-repeat;
			-moz-background-size: contain;
			-webkit-background-size: contain;
			filter: drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.7));
		}
	}
`;
