import styled from "@emotion/styled";
import type { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import ObjectRenderer from "@ext/markdown/elements/image/render/components/ObjectRenderer";
import { type CSSProperties, memo, useRef } from "react";
import { TransformComponent } from "react-zoom-pan-pinch";

interface ImageProps {
	id: string;
	objects: ImageObject[];
	src?: string;
	svg?: string;
	className?: string;
	modalStyle?: CSSProperties;
	html?: string | TrustedHTML;
}

export type Rect = {
	left: number;
	top: number;
	scale: number;
};

const MediaRenderer = (props: ImageProps) => {
	const { id, className, src, svg, objects = [], modalStyle } = props;
	const imgRef = useRef<HTMLImageElement>();
	const containerRef = useRef<HTMLDivElement>();

	return (
		<div className={className}>
			<TransformComponent wrapperClass="transform-wrapper">
				<div className={`image-container ${svg ? "image-container--svg" : ""}`} ref={containerRef}>
					{svg ? (
						<div
							dangerouslySetInnerHTML={{ __html: svg }}
							draggable={false}
							id={id}
							ref={imgRef}
							style={modalStyle}
						/>
					) : (
						<img alt="" draggable="false" id={id} key={id} ref={imgRef} src={src} style={modalStyle} />
					)}

					<div className="object-container">
						<ObjectRenderer editable={false} imageRef={imgRef} objects={objects} parentRef={containerRef} />
					</div>
				</div>
			</TransformComponent>
		</div>
	);
};

export default styled(memo(MediaRenderer))`
	justify-items: center;
	align-content: center;
	width: 100%;
	height: 100%;

	.image-container--svg {
		height: 80dvh;
	}

	.image-container--svg div:first-of-type {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
	}

	.image-container--svg div:first-of-type svg {
		max-width: unset !important;
		width: auto !important;
		height: 100% !important;
	}
`;
