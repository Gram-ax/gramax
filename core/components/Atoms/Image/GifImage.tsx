import styled from "@emotion/styled";
import React, { ReactEventHandler, useEffect, useRef, useState } from "react";

export const GifImage = styled(
	({
		src,
		alt,
		title,
		className,
		noplay,
		onError,
	}: {
		src: string;
		alt?: string;
		title?: string;
		className?: string;
		noplay?: boolean;
		onError?: ReactEventHandler<HTMLImageElement>;
	}) => {
		const gif = useRef<HTMLImageElement>();
		const button = useRef<HTMLDivElement>();
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
				<div className={"ff-container ff-" + (isPlaying ? "active" : "inactive")}>
					<div className="ff-button" ref={button} />
					<canvas className="ff-canvas" ref={canvas} />
					<img
						onError={onError}
						src={src}
						data-focusable="true"
						className="ff-gif"
						alt={alt}
						ref={gif}
						loading="lazy"
						onLoad={() => {
							const w = (canvas.current.width = gif.current.width);
							const h = (canvas.current.height = gif.current.height);
							canvas.current.getContext("2d").drawImage(gif.current, 0, 0, w, h);
						}}
					/>
					{title && <em>{title}</em>}
				</div>
			</div>
		);
	},
)`
	display: flex;
	justify-content: center;

	img,
	canvas {
		margin: 0.5em auto 0.5em auto !important;
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
		z-index: -1;
	}

	.ff-container {
		display: inline-block;
		position: relative;

		.ff-canvas {
			position: absolute;
		}

		.ff-button {
			top: 0%;
			left: 0%;
			right: 0%;
			bottom: 0%;
			margin: auto;
			z-index: 100;
			cursor: pointer;
			max-width: 94px;
			max-height: 94px;
			position: absolute;
			background-size: contain;
			background-position: center;
			background-repeat: no-repeat;
			-moz-background-size: contain;
			-webkit-background-size: contain;
			background-image: url(data:image/png;base64,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);
		}
	}
`;
