import Skeleton from "@components/Atoms/ImageSkeleton";
import { ReactNode } from "react";

interface ImageSkeletonProps {
	width: string;
	height: string;
	isLoaded: boolean;
	children: ReactNode;
}

export const ImageSkeleton = (props: ImageSkeletonProps) => {
	const { width, height, children, isLoaded } = props;

	return (
		<Skeleton height={height} isLoaded={isLoaded} width={width}>
			{children}
		</Skeleton>
	);
};
