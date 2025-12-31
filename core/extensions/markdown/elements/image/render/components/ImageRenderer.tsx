import AlertError from "@components/AlertError";
import GifImage from "@components/Atoms/Image/GifImage";
import Image from "@components/Atoms/Image/Image";
import HoverableActions from "@components/controls/HoverController/HoverableActions";
import Path from "@core/FileProvider/Path/Path";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import ImageResizer from "@ext/markdown/elements/image/edit/components/ImageResizer";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { ImageSkeleton } from "@ext/markdown/elements/image/render/components/ImageSkeleton";
import ObjectRenderer from "@ext/markdown/elements/image/render/components/ObjectRenderer";
import { cropImage } from "@ext/markdown/elements/image/render/logic/cropImage";
import {
	createContext,
	CSSProperties,
	forwardRef,
	memo,
	ReactElement,
	ReactEventHandler,
	RefObject,
	useCallback,
	useContext,
	useEffect,
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
				{isLoaded && (
					<ObjectRenderer
						imageRef={ref as RefObject<HTMLImageElement>}
						objects={objects}
						editable={false}
						parentRef={imageContainerRef}
						originalWidth={width}
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

	const [error, setError] = useState<boolean>(false);
	const [imageSrc, setImageSrc] = useState<string>(null);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	const isGif = new Path(realSrc).extension == "gif";
	const { useGetResource, getBuffer } = ResourceService.value;

	const mainContainerRef = useRef<HTMLDivElement>(null);
	const imageContainerRef = useRef<HTMLDivElement>(null);
	const imgRef = useRef<HTMLImageElement>(null);
	const initialLoadDoneRef = useRef<boolean>(false);

	const onError = useCallback(() => {
		setError(true);
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
		async (buffer: Buffer) => {
			if (!buffer || !buffer.byteLength) return setError(true);
			if (initialLoadDoneRef.current) return;
			if (isLoaded) setIsLoaded(false);

			await cropImg(buffer, crop);
		},
		realSrc,
		undefined,
		hasParentPath,
		isPrint,
	);

	if (error) {
		return (
			<AlertError
				title={t(`alert.${isGif ? "gif" : "image"}.unavailable`)}
				error={{ message: t("alert.image.path") }}
			/>
		);
	}

	if (isGif) {
		return (
			<BlockCommentView commentId={commentId}>
				<GifImage
					src={imageSrc}
					title={noEm ? "" : title}
					alt={title}
					onError={onError}
					hoverElementRef={hoverElementRef}
					setIsHovered={setIsHovered}
					isHovered={isHovered}
					rightActions={rightActions}
					width={width}
					height={height}
					realSrc={realSrc}
				/>
			</BlockCommentView>
		);
	}

	return (
		<ImageContext.Provider
			value={{
				imageContainerRef,
				mainContainerRef,
				imgRef,
				attrs: { id, width, height, crop, scale, title, alt, objects, src: realSrc },
				isLoaded,
			}}
		>
			<div
				className={className}
				data-float={float ? float : undefined}
				data-resize-container={float ? float : undefined}
			>
				<div ref={mainContainerRef} className="main-container">
					<div className="resizer-container">
						<HoverableActions
							hoverElementRef={hoverElementRef}
							isHovered={isHovered}
							setIsHovered={setIsHovered}
							actionsOptions={IMAGE_ACTIONS_OPTIONS}
							rightActions={rightActions}
						>
							<div ref={imageContainerRef}>
								<BlockCommentView commentId={commentId}>
									<ImageSkeleton
										width={width}
										height={height}
										crop={crop}
										scale={scale}
										isLoaded={error || isLoaded}
										mainContainerRef={mainContainerRef}
									>
										<ImageR
											ref={imgRef}
											src={imageSrc}
											onLoad={onLoad}
											onError={onError}
											openEditor={openEditor}
										/>
									</ImageSkeleton>
								</BlockCommentView>
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
