import AlertError from "@components/AlertError";
import GifImage from "@components/Atoms/Image/GifImage";
import Image from "@components/Atoms/Image/Image";
import Skeleton from "@components/Atoms/Skeleton";
import HoverableActions from "@components/controls/HoverController/HoverableActions";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import getAdjustedSize from "@core-ui/utils/getAdjustedSize";
import Path from "@core/FileProvider/Path/Path";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import ImageResizer from "@ext/markdown/elements/image/edit/components/ImageResizer";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import ObjectRenderer from "@ext/markdown/elements/image/render/components/ObjectRenderer";
import { cropImage } from "@ext/markdown/elements/image/render/logic/cropImage";
import {
	CSSProperties,
	forwardRef,
	memo,
	ReactElement,
	ReactEventHandler,
	RefObject,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

interface ImageRProps {
	id: string;
	title: string;
	objects: ImageObject[];
	src: string;
	alt: string;
	realSrc: string;
	originalWidth: string;
	isLoaded: boolean;
	imageContainerRef: RefObject<HTMLDivElement>;
	onLoad: (e) => void;
	onError: (e) => void;
	openEditor?: () => void;
}

const ImageR = forwardRef<HTMLImageElement, ImageRProps>((props, ref) => {
	const {
		id,
		realSrc,
		src,
		imageContainerRef,
		title,
		alt,
		objects,
		onError,
		openEditor,
		onLoad,
		originalWidth,
		isLoaded,
	} = props;

	return (
		<div className="image-container" data-focusable="true">
			<Image
				ref={ref}
				id={id}
				modalEdit={openEditor}
				onLoad={onLoad}
				modalTitle={title}
				onError={onError}
				src={src}
				alt={alt}
				objects={objects}
				realSrc={realSrc}
			/>
			<div className="object-container">
				<ObjectRenderer
					isLoaded={isLoaded}
					imageRef={ref as RefObject<HTMLImageElement>}
					objects={objects}
					editable={false}
					parentRef={imageContainerRef}
					originalWidth={originalWidth}
				/>
			</div>
		</div>
	);
});

interface ImageProps {
	realSrc: string;
	src?: string;
	noEm?: boolean;
	openEditor?: () => void;
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
	hoverElementRef?: RefObject<HTMLDivElement>;
	getBuffer?: (src: string) => Buffer;
	updateAttributes?: (attributes: Record<string, any>, transaction?: boolean) => void;
	width?: string;
	height?: string;
	showResizer?: boolean;
	isHovered?: boolean;
	setIsHovered?: (isHovered: boolean) => void;
	rightActions?: ReactElement;
}

const ImageRenderer = memo((props: ImageProps): ReactElement => {
	const {
		openEditor,
		id,
		realSrc,
		alt,
		crop,
		title,
		readFromHead,
		className,
		scale,
		updateAttributes,
		width,
		height,
		objects,
		noEm,
		showResizer,
		hoverElementRef,
		isHovered,
		setIsHovered,
		rightActions,
	} = props;

	const [error, setError] = useState<boolean>(false);
	const [imageSrc, setImageSrc] = useState<string>(null);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [size, setSize] = useState<{ width: string; height: string }>(null);

	const isGif = new Path(realSrc).extension == "gif";
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { useGetContent, getBuffer } = OnLoadResourceService.value;

	const mainContainerRef = useRef<HTMLDivElement>(null);
	const imageContainerRef = useRef<HTMLDivElement>(null);
	const imgRef = useRef<HTMLImageElement>(null);
	const articleRef = ArticleRefService.value;

	const onError = useCallback(() => {
		setError(true);
	}, []);

	const onLoad = useCallback(() => {
		if (!imageSrc) return;
		setIsLoaded(true);
	}, [imageSrc]);

	const setSrc = useCallback(
		(newSrc: Blob) => {
			if (imageSrc) URL.revokeObjectURL(imageSrc);
			setImageSrc(URL.createObjectURL(newSrc));
		},
		[imageSrc],
	);

	const cropImg = useCallback(
		async (buffer: Buffer) => {
			const container = mainContainerRef.current;
			const croppedBlob = await cropImage(container, crop, realSrc, buffer);
			setSrc(croppedBlob);
		},
		[mainContainerRef.current, crop, realSrc, setSrc],
	);

	const saveResize = useCallback(
		(scale: number) => {
			updateAttributes?.({ scale });
		},
		[updateAttributes],
	);

	useLayoutEffect(() => {
		if (!width?.endsWith("px")) return;
		const parentWidth =
			mainContainerRef.current?.clientWidth ||
			articleRef.current?.firstElementChild?.firstElementChild?.clientWidth;

		if (!parentWidth) return;
		const newSize = getAdjustedSize(parseFloat(width), parseFloat(height), parentWidth, scale);
		setSize({ width: newSize.width + "px", height: newSize.height + "px" });
	}, [width, height]);

	useEffect(() => {
		if (!isLoaded) return;
		const buffer = getBuffer(realSrc);

		if (!buffer) return setError(true);
		setIsLoaded(false);
		void cropImg(buffer);
	}, [crop]);

	useEffect(() => {
		const buffer = getBuffer(realSrc);
		if (!buffer?.byteLength) return;
		setIsLoaded(false);
		void cropImg(buffer);
	}, []);

	useGetContent(
		realSrc,
		apiUrlCreator,
		(buffer: Buffer) => {
			if (!buffer || !buffer.byteLength) return setError(true);
			setIsLoaded(false);
			void cropImg(buffer);
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

	if (isGif) return <GifImage src={imageSrc} title={title} alt={title} onError={onError} />;

	return (
		<div className={className}>
			<div ref={mainContainerRef} className="main-container">
				<div className="resizer-container">
					<HoverableActions
						hoverElementRef={hoverElementRef}
						isHovered={isHovered}
						setIsHovered={setIsHovered}
						rightActions={rightActions}
					>
						<div ref={imageContainerRef}>
							<Skeleton width={size?.width} height={size?.height} isLoaded={error || isLoaded}>
								<ImageR
									isLoaded={isLoaded}
									ref={imgRef}
									id={id}
									title={title}
									src={imageSrc}
									alt={alt}
									originalWidth={width}
									imageContainerRef={imageContainerRef}
									objects={objects}
									realSrc={realSrc}
									onLoad={onLoad}
									onError={onError}
									openEditor={openEditor}
								/>
							</Skeleton>
						</div>
					</HoverableActions>
					{isLoaded && (
						<ImageResizer
							scale={scale}
							selected={showResizer}
							saveResize={saveResize}
							imageRef={imgRef}
							containerRef={mainContainerRef}
						/>
					)}
				</div>
			</div>
			{title && !noEm && <em>{title}</em>}
		</div>
	);
});

export default styled(ImageRenderer)`
	page-break-inside: avoid;
	break-inside: avoid;
	user-select: none;

	.main-container {
		display: flex;
		width: 100%;
	}

	.resizer-container {
		display: flex;
		max-width: 100%;
		position: relative;
		justify-content: center;
		margin: 0 auto 0.5em auto;
		border-radius: var(--radius-small);
	}

	.image-container {
		display: flex;
		max-width: 100%;
		position: relative;
		justify-content: center;
		border-radius: var(--radius-small);
	}

	.skeleton {
		border-radius: var(--radius-small);
	}

	img {
		user-select: none;
	}
`;
