import Skeleton from "@components/Atoms/ImageSkeleton";
import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import styled from "@emotion/styled";
import InlineCommentView from "@ext/markdown/elements/comment/edit/components/View/InlineCommentView";
import { ResourceError } from "@ext/markdown/elements/copyArticles/errors";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import InlineImageError from "@ext/markdown/elements/inlineImage/render/components/InlineImageError";
import { ReactNode, useState } from "react";

interface InlineImageProps {
	src: string;
	alt: string;
	width: string;
	height: string;
	commentId?: string;
	isPrint?: boolean;
}

interface SkeletonWrapperProps {
	children: ReactNode;
	width: string;
	height: string;
	isLoaded: boolean;
}

const calculateDisplaySize = (width: string, height: string, maxHeight = "1.7em") => {
	const maxHeightPx = parseFloat(maxHeight) * 16;
	const widthNum = parseFloat(width);
	const heightNum = parseFloat(height);

	if (heightNum <= maxHeightPx) return { width, height };

	const scale = maxHeightPx / heightNum;
	const scaledWidth = widthNum * scale;

	return {
		width: `${scaledWidth}px`,
		height: maxHeight,
	};
};

const SkeletonWrapper = ({ children, width, height, isLoaded }: SkeletonWrapperProps) => {
	const displaySize = calculateDisplaySize(width, height);

	return (
		<Skeleton elementType="span" height={displaySize.height} isLoaded={isLoaded} width={displaySize.width}>
			{children}
		</Skeleton>
	);
};

const ContainerWrapper = styled(InlineCommentView)`
	display: inline-block;
	border-radius: var(--radius-small);
	vertical-align: middle;
	max-height: 1.7em;
	overflow: hidden;
	border-bottom: none !important;

	&[data-comment="true"].inline-comment-view {
		outline: 2px solid var(--color-comment-block-border) !important;
	}

	&[data-comment="true"].inline-comment-view:has(.active) {
		outline: 2px solid var(--color-comment-block-hover-border) !important;
	}

	img {
		max-height: 1.7em;
		object-fit: contain;
	}
`;

const InlineImage = ({ src: initialSrc, alt, width, height, commentId, isPrint }: InlineImageProps) => {
	const { useGetResource } = ResourceService.value;

	const [isLoaded, setIsLoaded] = useState(false);
	const [error, setError] = useState<ResourceError | null>(null);
	const [src, setSrc] = useState(null);

	const onLoad = () => {
		setIsLoaded(true);
	};

	const onError = () => {
		if (!src) return;
		setError(new ResourceError("Image error", initialSrc));
	};

	useGetResource(
		(buffer, resourceError) => {
			if (resourceError || !buffer || !buffer.byteLength)
				return setError(resourceError ?? new ResourceError("Image error", initialSrc));
			if (isLoaded) setIsLoaded(false);

			if (src) URL.revokeObjectURL(src);
			const url = URL.createObjectURL(new Blob([buffer as any], { type: resolveFileKind(buffer) }));
			setSrc(url);
		},
		initialSrc,
		undefined,
		undefined,
		isPrint,
	);

	const displaySize = calculateDisplaySize(width, height);

	return (
		<ContainerWrapper commentId={commentId}>
			<SkeletonWrapper height={height} isLoaded={!!error || isLoaded} width={width}>
				{error ? (
					<InlineImageError height={displaySize.height} resourceError={error} width={displaySize.width} />
				) : (
					<img alt={alt} data-focusable="true" onError={onError} onLoad={onLoad} src={src} />
				)}
			</SkeletonWrapper>
		</ContainerWrapper>
	);
};

export default InlineImage;
