import AlertError from "@components/AlertError";
import GifImage from "@components/Atoms/Image/GifImage";
import Image from "@components/Atoms/Image/Image";
import { resolveImageKind } from "@components/Atoms/Image/resolveImageKind";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import Path from "@core/FileProvider/Path/Path";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import ImageResizer from "@ext/markdown/elements/image/edit/components/ImageResizer";
import { getCroppedCanvas } from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import UnifiedComponent from "@ext/markdown/elements/image/render/components/ImageEditor/Unified";
import { CSSProperties, ReactElement, ReactEventHandler, useEffect, useRef, useState } from "react";

interface ImageProps {
	realSrc: string;
	src?: string;
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
	readFromHead?: boolean;
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
			const imageContainer = imageContainerRef.current;
			getCroppedCanvas({
				imageContainer,
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
			<div ref={mainContainerRef} className="image-container">
				<div className="resizer-container" data-focusable="true">
					<div ref={imageContainerRef}>
						<Image
							ref={imgElementRef}
							id={id}
							modalEdit={openEditor}
							modalTitle={title}
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
	.image-container {
		display: flex;
		justify-content: center;
		margin: 0.5em auto 0.5em auto;
	}

	.resizer-container {
		display: flex;
		position: relative;
		border-radius: var(--radius-small);
	}

	img {
		user-select: none;
	}
`;

const ImageRenderer = (props: ImageProps): ReactElement => {
	const { realSrc, title, readFromHead } = props;
	const [error, setError] = useState<boolean>(false);
	const isGif = new Path(realSrc).extension == "gif";
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [imageSrc, setImageSrc] = useState<string>(null);

	const setSrc = (newSrc: Blob) => {
		if (imageSrc) URL.revokeObjectURL(imageSrc);
		setImageSrc(URL.createObjectURL(newSrc));
	};

	OnLoadResourceService.useGetContent(
		realSrc,
		apiUrlCreator,
		(buffer: Buffer) => {
			if (!buffer) return;
			setSrc(new Blob([buffer], { type: resolveImageKind(buffer) }));
		},
		undefined,
		readFromHead,
	);

	if (error)
		return (
			<AlertError
				title={t(`alert.${isGif ? "gif" : "image"}.unavailable`)}
				error={{ message: t("alert.image.path") }}
			/>
		);
	if (isGif) return <GifImage src={imageSrc} title={title} alt={title} onError={() => setError(true)} />;
	return <StyledImageR onError={() => setError(true)} {...props} src={imageSrc} setSrc={setSrc} />;
};

export default ImageRenderer;
