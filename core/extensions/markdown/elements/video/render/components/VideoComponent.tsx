import Skeleton from "@components/Atoms/ImageSkeleton";
import { cn } from "@core-ui/utils/cn";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import getVideoLayout from "@ext/markdown/elements/video/logic/getVideoLayout";
import ErrorVideo from "@ext/markdown/elements/video/render/components/ErrorVideo";
import { useEffect, useState } from "react";
import RenderVideo from "./RenderVideo";
import videoComponentStyles, { getVideoAspectRatio } from "./videoComponentStyles";

interface VideoComponentProps {
	path: string;
	className?: string;
	commentId?: string;
}

const VideoComponent = ({ path, className, commentId }: VideoComponentProps) => {
	const [isError, setIsError] = useState(!path?.length);
	const [isLoaded, setIsLoaded] = useState(false);
	const layout = getVideoLayout(path);
	const showSkeleton = !isError && !isLoaded;

	useEffect(() => {
		setIsError(!path?.length);
	}, [path]);

	return (
		<div className={cn(className, videoComponentStyles({ layout }))} data-type="video">
			<BlockCommentView commentId={commentId}>
				<Skeleton
					isLoaded={!showSkeleton}
					style={showSkeleton ? { aspectRatio: getVideoAspectRatio(layout) } : { height: "100%" }}
					width="100%"
				>
					{isError ? (
						<ErrorVideo isLink isNoneError={!path} link={path} />
					) : (
						<RenderVideo setIsError={setIsError} setIsLoaded={setIsLoaded} url={path} />
					)}
				</Skeleton>
			</BlockCommentView>
		</div>
	);
};

export default VideoComponent;
