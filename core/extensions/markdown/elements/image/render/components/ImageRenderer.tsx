import GifImage from "@components/Atoms/Image/GifImage";
import Image from "@components/Atoms/Image/Image";
import HoverableActions from "@components/controls/HoverController/HoverableActions";
import Path from "@core/FileProvider/Path/Path";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import getAdjustedSize from "@core-ui/utils/getAdjustedSize";
import styled from "@emotion/styled";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import { ResourceError } from "@ext/markdown/elements/copyArticles/errors/ResourceError";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import ImageResizer from "@ext/markdown/elements/image/edit/components/ImageResizer";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import ImageError from "@ext/markdown/elements/image/render/components/ImageError";
import { ImageSkeleton } from "@ext/markdown/elements/image/render/components/ImageSkeleton";
import ObjectRenderer from "@ext/markdown/elements/image/render/components/ObjectRenderer";
import { cropImage } from "@ext/markdown/elements/image/render/logic/cropImage";
import {
	CSSProperties,
	createContext,
	forwardRef,
	memo,
	ReactElement,
	ReactEventHandler,
	RefObject,
	useCallback,
	useContext,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

interface ImageContextType {
	imageContainerRef: RefObject<HTMLDivElement>;
	mainContainerRef: RefObject<HTMLDivElement>;
	imgRef: RefObject<HTMLImageElement>;
	attrs: Record<string, any>;
	isLoaded: boolean;
}

export const ImageContext = createContext<ImageContextType>({
	imageContainerRef: null,
	mainContainerRef: null,
	imgRef: null,
	attrs: null,
	isLoaded: false,
});

interface ImageRProps {
	src: string;
	onLoad: (e) => void;
	onError: (e) => void;
	openEditor?: () => void;
}

const IMAGE_ACTIONS_OPTIONS = {
	comment: true,
	float: true,
};

const ImageR = forwardRef<HTMLImageElement, ImageRProps>((props, ref) => {
	const { src, onError, openEditor, onLoad } = props;
	const {
		attrs: { id, title, alt, objects, width, src: realSrc },
		isLoaded,
		imageContainerRef,
	} = useContext(ImageContext);

	return (
		<div className="image-container" data-focusable="true">
			<Image
				alt={alt}
				id={id}
				modalEdit={openEditor}
				modalTitle={title}
				objects={objects}
				onError={onError}
				onLoad={onLoad}
				realSrc={realSrc}
				ref={ref}
				src={src}
			/>
			<div className="object-container">
				{isLoaded && (
					<ObjectRenderer
						editable={false}
						imageRef={ref as RefObject<HTMLImageElement>}
						objects={objects}
						originalWidth={width}
						parentRef={imageContainerRef}
					/>
				)}
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
	marginBottom?: string;
	scale?: number;
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
	commentId?: string;
	float?: string;
	hasParentPath?: boolean;
	isPrint?: boolean;
}

const ImageRenderer = memo((props: ImageProps): ReactElement => {
	const {
		openEditor,
		id,
		realSrc,
		alt,
		crop,
		title,
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
		commentId,
		float,
		hasParentPath = true,
		isPrint,
	} = props;

	const articleRef = ArticleRefService.value;

	const [error, setError] = useState<ResourceError | null>(null);
	const [imageSrc, setImageSrc] = useState<string>(null);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [size, setSize] = useState<{ width: string; height: string }>(null);

	const isGif = new Path(realSrc).extension == "gif";
	const { useGetResource, getBuffer } = ResourceService.value;

	const mainContainerRef = useRef<HTMLDivElement>(null);
	const imageContainerRef = useRef<HTMLDivElement>(null);
	const imgRef = useRef<HTMLImageElement>(null);
	const initialLoadDoneRef = useRef<boolean>(false);

	const onError = useCallback(() => {
		setError(new ResourceError("Image error", realSrc));
	}, []);

	const onLoad = useCallback(() => {
		if (!imageSrc) return;
		setIsLoaded(true);
	}, [imageSrc]);

	const setSrc = useCallback((newSrc: Blob) => {
		setImageSrc((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return URL.createObjectURL(newSrc);
		});
	}, []);

	const cropImg = useCallback(
		async (buffer: Buffer, crop: Crop) => {
			const container = mainContainerRef.current;
			const croppedBlob = await cropImage(container, crop, realSrc, buffer);
			setSrc(croppedBlob);
		},
		[realSrc, setSrc],
	);

	const saveResize = useCallback(
		(scale: number) => {
			updateAttributes?.({ scale });
		},
		[updateAttributes],
	);

	useEffect(() => {
		if (!isLoaded) return;
		const buffer = getBuffer(realSrc);

		if (!buffer) return;
		setIsLoaded(false);
		void cropImg(buffer, crop);
	}, [crop]);

	useEffect(() => {
		const buffer = getBuffer(realSrc);
		if (!buffer?.byteLength) return;
		if (isLoaded) setIsLoaded(false);
		initialLoadDoneRef.current = true;
		void cropImg(buffer, crop);
	}, []);

	useGetResource(
		async (buffer, resourceError) => {
			if (resourceError || !buffer || !buffer.byteLength) {
				setError(resourceError ?? new ResourceError("Image error", realSrc));
				return;
			}
			if (initialLoadDoneRef.current) return;
			if (isLoaded) setIsLoaded(false);

			await cropImg(buffer, crop);
		},
		realSrc,
		undefined,
		hasParentPath,
		isPrint,
	);

	useLayoutEffect(() => {
		if (!width?.endsWith("px")) return;
		if (!mainContainerRef.current) return;
		const parentWidth =
			mainContainerRef.current?.clientWidth ||
			articleRef.current?.firstElementChild?.firstElementChild?.clientWidth;

		if (!parentWidth) return;
		const newWidth = (parseFloat(width) * (crop?.w || 100)) / 100;
		const newHeight = (parseFloat(height) * (crop?.h || 100)) / 100;
		const newSize = getAdjustedSize(newWidth, newHeight, parentWidth, scale);

		setSize({
			width: newSize.width + "px",
			height: newSize.height + "px",
		});
	}, [width, height, mainContainerRef.current]);

	if (isGif) {
		return (
			<BlockCommentView commentId={commentId}>
				{error ? (
					<ImageError height={height} resourceError={error} width={width} />
				) : (
					<GifImage
						alt={title}
						height={height}
						hoverElementRef={hoverElementRef}
						isHovered={isHovered}
						onError={onError}
						realSrc={realSrc}
						rightActions={rightActions}
						setIsHovered={setIsHovered}
						src={imageSrc}
						title={noEm ? "" : title}
						width={width}
					/>
				)}
			</BlockCommentView>
		);
	}

	return (
		<ImageContext.Provider
			value={{
				imageContainerRef,
				mainContainerRef,
				imgRef,
				attrs: { id, width: size?.width, height: size?.height, crop, scale, title, alt, objects, src: realSrc },
				isLoaded,
			}}
		>
			<div
				className={className}
				data-float={float ? float : undefined}
				data-resize-container={float ? float : undefined}
			>
				<div className="main-container" ref={mainContainerRef}>
					<div className="resizer-container">
						<HoverableActions
							actionsOptions={IMAGE_ACTIONS_OPTIONS}
							hoverElementRef={hoverElementRef}
							isHovered={isHovered}
							rightActions={error ? undefined : rightActions}
							setIsHovered={setIsHovered}
						>
							<div ref={imageContainerRef}>
								<BlockCommentView commentId={commentId}>
									<ImageSkeleton
										height={size?.height}
										isLoaded={!!error || isLoaded}
										width={size?.width}
									>
										{error ? (
											<ImageError
												height={size?.height}
												resourceError={error}
												width={size?.width}
											/>
										) : (
											<ImageR
												onError={onError}
												onLoad={onLoad}
												openEditor={openEditor}
												ref={imgRef}
												src={imageSrc}
											/>
										)}
									</ImageSkeleton>
								</BlockCommentView>
							</div>
						</HoverableActions>
						{isLoaded && (
							<ImageResizer
								containerRef={mainContainerRef}
								imageRef={imgRef}
								saveResize={saveResize}
								scale={scale}
								selected={showResizer}
							/>
						)}
					</div>
				</div>
				{title && !noEm && <em>{title}</em>}
			</div>
		</ImageContext.Provider>
	);
});

export default styled(ImageRenderer)`
	page-break-inside: avoid;
	break-inside: avoid;
	user-select: none;
	box-sizing: border-box;

	.main-container {
		display: flex;
		width: 100%;
		margin-bottom: ${({ marginBottom }) => marginBottom || "0.5em"} !important;
	}

	.resizer-container {
		display: flex;
		max-width: 100%;
		position: relative;
		justify-content: center;
		margin: 0 auto;
	}

	.image-container {
		display: flex;
		max-width: 100%;
		position: relative;
		justify-content: center;
	}

	.image-container,
	.resizer-container,
	.skeleton {
		border-radius: var(--radius-small);
	}

	.block-comment-view {
		border-radius: var(--radius-small) !important;
	}

	img {
		user-select: none;
		width: 100%;
	}
`;
