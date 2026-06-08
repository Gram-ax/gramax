import { cn } from "@core-ui/utils/cn";
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
		<div className={cn("w-full h-full content-center justify-items-center", className)}>
			<TransformComponent wrapperClass="transform-wrapper !w-full !h-full !absolute !top-0 !left-0">
				<div className={cn("image-container", svg && "image-container--svg h-[80dvh]")} ref={containerRef}>
					{svg ? (
						<div
							className="flex h-full w-full items-center justify-center [&>svg]:!h-full [&>svg]:!w-auto [&>svg]:!max-w-none"
							// biome-ignore lint/style/useNamingConvention: expected
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

export default memo(MediaRenderer);
