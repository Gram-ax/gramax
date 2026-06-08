import Skeleton from "@components/Atoms/ImageSkeleton";
import type { ReactNode } from "react";

interface ImageSkeletonProps {
	width: string;
	height: string;
	isLoaded: boolean;
	children: ReactNode;
	className?: string;
}

export const ImageSkeleton = (props: ImageSkeletonProps) => {
	const { width, height, children, isLoaded, className } = props;

	return (
		<Skeleton className={className} height={height} isLoaded={isLoaded} width={width}>
			{children}
		</Skeleton>
	);
};
