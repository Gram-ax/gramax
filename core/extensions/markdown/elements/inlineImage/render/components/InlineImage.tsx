import AlertError from "@components/AlertError";
import Skeleton from "@components/Atoms/ImageSkeleton";
import t from "@ext/localization/locale/translate";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { ReactNode, useState } from "react";
import styled from "@emotion/styled";
import InlineCommentView from "@ext/markdown/elements/comment/edit/components/InlineCommentView";
import { resolveFileKind } from "@core-ui/utils/resolveFileKind";

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
		<Skeleton elementType="span" width={displaySize.width} height={displaySize.height} isLoaded={isLoaded}>
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
	const [isError, setIsError] = useState(false);
	const [src, setSrc] = useState(null);

	const onLoad = () => {
		setIsLoaded(true);
	};

	const onError = () => {
		if (!src) return;
		setIsError(true);
	};

	useGetResource(
		(buffer) => {
			if (!buffer || !buffer.byteLength) return setIsError(true);
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

	if (isError) return <AlertError title={t("alert.image.unavailable")} error={{ message: t("alert.image.path") }} />;

	return (
		<ContainerWrapper commentId={commentId}>
			<SkeletonWrapper width={width} height={height} isLoaded={isLoaded}>
				<img src={src} alt={alt} onLoad={onLoad} onError={onError} data-focusable="true" />
			</SkeletonWrapper>
		</ContainerWrapper>
	);
};

export default InlineImage;
