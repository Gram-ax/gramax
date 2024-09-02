import AlertError from "@components/AlertError";
import { GifImage } from "@components/Atoms/Image/GifImage";
import Image from "@components/Atoms/Image/Image";
import Path from "@core/FileProvider/Path/Path";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import ImageResizer from "@ext/markdown/elements/image/edit/components/ImageResizer";
import { getCroppedCanvas } from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import UnifiedComponent from "@ext/markdown/elements/image/render/components/ImageEditor/Unified";
import { CSSProperties, ReactElement, ReactEventHandler, useEffect, useRef, useState } from "react";

interface ImageProps {
	realSrc: string;
	src: string;
	openEditor?: () => void;
	selected?: boolean;
	setSrc?: (newSrc: Blob) => void;
	alt?: string;
	title?: string;
	crop?: Crop;
	objects?: ImageObject[];
	id?: string;
	style?: CSSProperties;
	scale?: number;
	className?: string;
	onError?: ReactEventHandler<HTMLImageElement>;
	updateAttributes?: (attributes: Record<string, any>) => void;
}

const ImageR = (props: ImageProps): ReactElement => {
	const { src, realSrc, scale, className, title, alt, crop } = props;
	const { objects, id, setSrc, selected, updateAttributes, openEditor, onError } = props;

	const imageContainerRef = useRef<HTMLDivElement>(null);
	const mainContainerRef = useRef<HTMLDivElement>(null);
	const imgElementRef = useRef<HTMLImageElement>(null);

	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	useEffect(() => {
		if (isLoaded) {
			const imgElement = imgElementRef.current;
			const imageContainer = imageContainerRef.current;
			getCroppedCanvas({
				imageContainer,
				imgElement,
				crop: crop ?? { x: 0, y: 0, w: 100, h: 100 },
				realSrc,
				setSrc,
			});
		}
	}, [crop, isLoaded]);

	const saveResize = (resize: number) => {
		updateAttributes({ scale: resize });
	};

	return (
		<div className={className}>
			<div ref={mainContainerRef} className="main__container">
				<div className="resizer__container" data-focusable="true">
					<div ref={imageContainerRef} className="image__container">
						<Image
							ref={imgElementRef}
							id={id}
							modalEdit={openEditor}
							onLoad={() => !isLoaded && setIsLoaded(true)}
							onError={onError}
							src={src}
							alt={alt}
							objects={objects}
							realSrc={realSrc}
						/>
						{objects?.map?.((data: ImageObject, index: number) => (
							<UnifiedComponent
								key={index}
								index={index}
								parentRef={imageContainerRef}
								{...data}
								editable={false}
								type={data.type}
								drawIndexes={objects.length > 1}
							/>
						))}
					</div>
					<ImageResizer
						saveResize={saveResize}
						imageRef={imgElementRef}
						containerRef={mainContainerRef}
						selected={selected}
						scale={scale}
					/>
				</div>
			</div>

			{title && <em>{title}</em>}
		</div>
	);
};

const StyledImageR = styled(ImageR)`
	.main__container {
		display: flex;
		justify-content: center;
		margin: 0.5em auto 0.5em auto;
		max-width: calc(100% - 1.5em);
	}

	.resizer__container {
		display: flex;
		position: relative;
		border-radius: var(--radius-small);
	}

	em {
		display: block;
		font-size: 13px;
		font-weight: 300;
		line-height: 1.4em;
		text-align: center;
		color: var(--color-image-title);
	}

	img {
		user-select: none;
		${(p) => (p.selected ? "pointer-events: auto !important;" : "pointer-events: none !important;")}
	}
`;

const ImageRenderer = (props: ImageProps): ReactElement => {
	const { src, realSrc, title } = props;
	const [error, setError] = useState<boolean>(false);
	const isGif = new Path(realSrc).extension == "gif";

	if (error)
		return (
			<AlertError
				title={t(`alert.${isGif ? "gif" : "image"}.unavailable`)}
				error={{ message: t("alert.image.path") }}
			/>
		);
	if (isGif) return <GifImage src={src} title={title} alt={title} onError={() => setError(true)} />;
	return <StyledImageR onError={() => setError(true)} {...props} />;
};

export default ImageRenderer;
