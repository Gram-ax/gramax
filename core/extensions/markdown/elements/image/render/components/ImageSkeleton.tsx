import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import getAdjustedSize from "@core-ui/utils/getAdjustedSize";
import { Crop } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { ReactNode, RefObject, useLayoutEffect, useState } from "react";
import Skeleton from "@components/Atoms/ImageSkeleton";

interface ImageSkeletonProps {
	width: string;
	height: string;
	crop: Crop;
	scale: number;
	mainContainerRef: RefObject<HTMLDivElement>;
	isLoaded: boolean;
	children: ReactNode;
}

export const ImageSkeleton = (props: ImageSkeletonProps) => {
	const { width, height, crop, scale, mainContainerRef, children, isLoaded } = props;
	const [size, setSize] = useState<{ width: string; height: string }>(null);
	const articleRef = ArticleRefService.value;

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

	return (
		<Skeleton width={size?.width} height={size?.height} isLoaded={isLoaded}>
			{children}
		</Skeleton>
	);
};
