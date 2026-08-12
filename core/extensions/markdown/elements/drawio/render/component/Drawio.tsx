import Image from "@components/Atoms/Image/Image";
import Skeleton from "@components/Atoms/ImageSkeleton";
import type { ResourceError } from "@core-ui/ContextServices/ResourceService/errors";
import { useGetResource } from "@core-ui/ContextServices/ResourceService/hooks/useGetResource";
import { useAdjustedElementSize } from "@core-ui/hooks/useAdjustedElementSize";
import useElementInViewport from "@core-ui/hooks/useElementInViewport";
import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import { ArticleComponentResizer } from "@ext/article/Components/ArticleComponentResizer";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import DiagramError from "@ext/markdown/elements/diagrams/component/DiagramError";
import { forwardRef, type MutableRefObject, type ReactElement, useCallback, useRef, useState } from "react";

interface DrawioProps {
	id: string;
	src: string;
	title: string;
	width: string;
	height: string;
	openEditor?: () => void;
	noEm?: boolean;
	scale?: number;
	commentId?: string;
	isPrint?: boolean;
}

const DRAWIO_SKELETON_MIN_HEIGHT = "12rem";

const Drawio = forwardRef((props: DrawioProps, refT: MutableRefObject<HTMLImageElement>): ReactElement => {
	const { id, src, title, width, height, openEditor, noEm, commentId, isPrint, scale } = props;

	const ref = refT || useRef<HTMLImageElement>(null);
	const parentRef = useRef<HTMLDivElement>(null);
	const isInViewport = useElementInViewport(parentRef, {
		rootMargin: "600px 0px",
		enabled: !isPrint,
	});

	const [imageSrc, setImageSrc] = useState<string>(null);
	const [isLoaded, setIsLoaded] = useState<boolean>(false);
	const [error, setError] = useState<ResourceError>(null);

	const setSrc = (newSrc: Blob) => {
		if (imageSrc) URL.revokeObjectURL(imageSrc);
		setImageSrc(URL.createObjectURL(newSrc));
	};

	const onLoad = () => {
		if (!imageSrc) return;
		setIsLoaded(true);
	};

	const getParentWidth = useCallback(() => parentRef.current?.clientWidth ?? 0, []);
	const getOffset = useCallback(() => {
		if (!ref.current?.parentElement) return 0;
		const computedStyle = window.getComputedStyle(ref.current.parentElement);
		return parseFloat(computedStyle.marginTop) + parseFloat(computedStyle.paddingTop);
	}, [ref]);

	const size = useAdjustedElementSize({ width, height, scale, getParentWidth, getOffset });

	useGetResource(
		(buffer, resourceError) => {
			if (resourceError) return setError(resourceError);
			setIsLoaded(false);
			setSrc(new Blob([buffer as BlobPart], { type: resolveFileKind(buffer) }));
		},
		src,
		undefined,
		undefined,
		isPrint,
		!isInViewport,
	);

	if (!src || error) return <DiagramError diagramName="diagrams.net" error={error} />;

	const diagram = (
		<BlockCommentView commentId={commentId} style={{ borderRadius: "var(--radius-large)" }}>
			<Skeleton
				height={size?.height}
				isLoaded={isLoaded}
				style={!isLoaded && !size?.height ? { minHeight: DRAWIO_SKELETON_MIN_HEIGHT } : undefined}
				width="100%"
			>
				<div
					className="w-full bg-[var(--color-diagram-bg)] rounded-[var(--radius-large)] [&_img]:bg-transparent [&_img]:!shadow-none [&_img]:w-full"
					data-focusable="true"
				>
					<div className="drawio flex justify-center px-[0.8em] my-[0.5em]">
						<Image
							id={id}
							modalEdit={openEditor}
							modalStyle={{
								backgroundColor: "var(--color-diagram-bg)",
								borderRadius: "var(--radius-large)",
								padding: "20px",
							}}
							modalTitle={title}
							onLoad={onLoad}
							realSrc={src}
							ref={ref}
							src={imageSrc}
						/>
					</div>
				</div>
			</Skeleton>
		</BlockCommentView>
	);

	return (
		<div
			data-qa="qa-drawio"
			data-resize-container={openEditor ? true : undefined}
			data-testid="drawio"
			ref={parentRef}
		>
			{openEditor ? (
				diagram
			) : (
				<ArticleComponentResizer disabled isPrint={isPrint} scale={scale}>
					{diagram}
				</ArticleComponentResizer>
			)}

			{title && !noEm && <em>{title}</em>}
		</div>
	);
});

export default Drawio;
