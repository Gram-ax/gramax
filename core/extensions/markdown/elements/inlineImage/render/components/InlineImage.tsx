import AlertError from "@components/AlertError";
import Skeleton from "@components/Atoms/ImageSkeleton";
import t from "@ext/localization/locale/translate";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { ReactNode, RefObject, useState } from "react";
import styled from "@emotion/styled";
import HoverableActions from "@components/controls/HoverController/HoverableActions";

interface InlineImageProps {
	src: string;
	alt: string;
	width: string;
	height: string;
	actions: ReactNode;
	hoverElementRef: RefObject<HTMLDivElement>;
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

const ContainerWrapper = styled.span`
	display: inline-block;
	border-radius: var(--radius-small);
	vertical-align: middle;
	max-height: 1.7em;
	overflow: hidden;

	img {
		max-height: 1.7em;
		object-fit: contain;
	}
`;

interface HoverComponentProps {
	children: React.ReactNode;
	hoverElementRef: React.RefObject<HTMLDivElement>;
	actions: React.ReactNode;
}

const HoverComponent = ({ children, hoverElementRef, actions }: HoverComponentProps) => {
	if (!hoverElementRef) return children;
	const [isHovered, setIsHovered] = useState(false);

	return (
		<HoverableActions
			isHovered={isHovered}
			setIsHovered={setIsHovered}
			hoverElementRef={hoverElementRef}
			rightActions={actions}
			placement="top"
		>
			{children}
		</HoverableActions>
	);
};

const InlineImage = ({ src: initialSrc, alt, width, height, actions, hoverElementRef }: InlineImageProps) => {
	const { useGetResource } = ResourceService.value;

	const [isLoaded, setIsLoaded] = useState(false);
	const [isError, setIsError] = useState(false);
	const [src, setSrc] = useState(null);

	const onLoad = () => {
		setIsLoaded(true);
	};

	const onError = () => {
		setIsError(true);
	};

	useGetResource((buffer) => {
		const url = URL.createObjectURL(new Blob([buffer as any]));
		if (src) URL.revokeObjectURL(src);
		setSrc(url);
	}, initialSrc);

	if (isError) return <AlertError title={t("alert.image.unavailable")} error={{ message: t("alert.image.path") }} />;

	return (
		<HoverComponent hoverElementRef={hoverElementRef} actions={isError ? undefined : actions}>
			<ContainerWrapper className="focus-pointer-events" data-focusable="true">
				<SkeletonWrapper width={width} height={height} isLoaded={isLoaded}>
					<img src={src} alt={alt} onLoad={onLoad} onError={onError} />
				</SkeletonWrapper>
			</ContainerWrapper>
		</HoverComponent>
	);
};

export default InlineImage;
