import AlertError from "@components/AlertError";
import { GifImage } from "@components/Atoms/Image/GifImage";
import Image from "@components/Atoms/Image/Image";
import Path from "@core/FileProvider/Path/Path";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { getCroppedCanvas } from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import UnifiedComponent from "@ext/markdown/elements/image/render/components/ImageEditor/Unified";
import { ReactElement, useEffect, useRef, useState } from "react";

interface ImageProps {
	realSrc: string;
	src: string;
	setSrc?: (newSrc: Blob) => void;
	alt?: string;
	title?: string;
	crop?: Crop;
	objects?: ImageObject[];
	id?: string;
	className?: string;
}

const ImageR = (props: ImageProps): ReactElement => {
	const { src, realSrc, className, title, alt, crop, objects, id, setSrc } = props;

	const imageContainerRef = useRef<HTMLDivElement>(null);
	const imgElementRef = useRef<HTMLImageElement>(null);

	const [elements, setElements] = useState<ImageObject[]>([]);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const [error, setError] = useState<boolean>(false);

	useEffect(() => {
		setElements(objects ?? []);
	}, [objects]);

	useEffect(() => {
		if (isLoaded && !error) {
			const imgElement = imgElementRef.current;
			const imageContainer = imageContainerRef.current;
			getCroppedCanvas({ imageContainer, imgElement, crop: crop ?? { x: 0, y: 0, w: 100, h: 100 }, src, setSrc });
		}
	}, [crop, isLoaded, error]);

	const onErrorHandler = () => {
		setError(true);
	};

	return error ? (
		<AlertError title={t("alert.image.unavailable")} error={{ message: t("alert.image.path") }} />
	) : (
		<div className={className}>
			<div className="main__container">
				<div ref={imageContainerRef} className="image__container">
					<Image
						ref={imgElementRef}
						id={id}
						onLoad={() => !isLoaded && setIsLoaded(true)}
						onError={onErrorHandler}
						src={src}
						alt={alt}
						objects={objects}
						realSrc={realSrc}
					/>
					{elements.map((data: ImageObject, index: number) => (
						<UnifiedComponent
							key={index}
							index={index}
							parentRef={imageContainerRef}
							{...data}
							editable={false}
							type={data.type}
							drawIndexes={elements.length > 1}
						/>
					))}
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
	}

	.image__container {
		position: relative;
	}

	em {
		display: block;
		font-size: 13px;
		font-weight: 300;
		line-height: 1.4em;
		text-align: center;
		color: var(--color-image-title);
	}

	.article img {
		user-select: none;
	}
`;

const ImageRenderer = (props: ImageProps): ReactElement => {
	const { src, realSrc, alt, title, crop, objects, id, className, setSrc } = props;

	if (new Path(src).extension == "gif") return <GifImage src={src} title={title} alt={title} />;
	return (
		<>
			<StyledImageR
				id={id}
				setSrc={setSrc}
				realSrc={realSrc}
				src={src}
				alt={alt}
				title={title}
				crop={crop}
				objects={objects}
				className={className}
			/>
		</>
	);
};

export default ImageRenderer;
