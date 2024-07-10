import { GifImage } from "@components/Atoms/Image/GifImage";
import Image from "@components/Atoms/Image/Image";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import getImageSize from "@core-ui/getImageSize";
import Path from "@core/FileProvider/Path/Path";
import styled from "@emotion/styled";
import { calculateScale, cropImage, restoreImage } from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import UnifiedComponent from "@ext/markdown/elements/image/render/components/ImageEditor/Unified";
import { ReactElement, ReactEventHandler, useEffect, useRef, useState } from "react";

interface ImageProps {
	realSrc: string;
	src: string;
	alt?: string;
	title?: string;
	crop?: Crop;
	objects?: ImageObject[];
	id?: string;
	className?: string;
}

const ImageR = (props: ImageProps): ReactElement => {
	const { src, realSrc, className, title, alt, crop, objects, id } = props;

	const imageContainerRef = useRef<HTMLDivElement>(null);
	const imgElementRef = useRef<HTMLImageElement>(null);

	const articleRef = ArticleRefService.value;
	const [imageSrc, setImageSrc] = useState<string>(null);
	const [elements, setElements] = useState<ImageObject[]>([]);
	const [imageSize, setImageSize] = useState<{ w: number; h: number }>(null);

	useEffect(() => {
		if (!imgElementRef.current || !imageSize || !crop) return;
		const image = imgElementRef.current;
		restoreImage(image, imageSize);
		const scale = calculateScale(imageContainerRef.current, imageSize, crop);
		cropImage({ image, imageSize, crop, scale });
	}, [crop]);

	useEffect(() => {
		if (!src) return;

		setImageSrc(src);
		setElements(objects ?? []);
	}, [objects]);

	useEffect(() => {
		if (!imgElementRef.current || !imageSize || !crop) return;

		const target = imgElementRef.current;
		const parent = target.parentElement;

		parent.style.width = imageSize.w + "px";
		parent.style.height = imageSize.h + "px";

		target.style.width = imageSize.w + "px";
		target.style.height = imageSize.h + "px";

		target.style.position = "absolute";

		if (crop) {
			const scale = calculateScale(imageContainerRef.current, imageSize, crop);
			cropImage({ image: target, imageSize, crop, scale });
		}
	}, [imageSize, crop, imgElementRef, imageContainerRef]);

	const onLoadHandler: ReactEventHandler<HTMLImageElement> = (e) => {
		const target = e.target as HTMLImageElement;
		const imageSize = { w: target.clientWidth, h: target.clientHeight };

		if (imageSize.h === 0 || imageSize.w === 0) {
			getImageSize(src, ({ w, h }) => {
				const articleWidth = (articleRef?.current?.firstElementChild?.clientWidth ?? 820) - 120;
				if (w >= articleWidth) {
					setImageSize({ w: articleWidth, h: (h * articleWidth) / w });
				} else {
					setImageSize({ w, h });
				}
			});
		} else {
			setImageSize(imageSize);
		}
	};

	return (
		<div className={className}>
			<div data-focusable="true" className="main__container">
				<div ref={imageContainerRef} className="image__container">
					<Image
						ref={imgElementRef}
						id={id}
						onLoad={onLoadHandler}
						src={imageSrc}
						alt={alt}
						objects={objects}
						crop={crop}
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
		position: relative;
		margin: 0.5em auto 0.5em auto;
		max-width: 100%;
		max-height: 100%;
		overflow: hidden;
		width: fit-content;
		height: fit-content;
		box-shadow: var(--shadows-deeplight);
	}

	em {
		display: block;
		font-size: 13px;
		font-weight: 300;
		line-height: 1.4em;
		text-align: center;
		color: var(--color-image-title);
	}

	.image__container {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.article img {
		user-select: none;
	}
`;

const ImageRenderer = (props: ImageProps): ReactElement => {
	const { src, realSrc, alt, title, crop, objects, id, className } = props;

	if (new Path(src).extension == "gif") return <GifImage src={src} title={title} alt={title} />;
	return (
		<>
			<StyledImageR
				key={src}
				id={id}
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
