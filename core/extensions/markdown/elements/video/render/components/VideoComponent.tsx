import Skeleton from "@components/Atoms/ImageSkeleton";
import { cn } from "@core-ui/utils/cn";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import ErrorVideo from "@ext/markdown/elements/video/render/components/ErrorVideo";
import { useEffect, useState } from "react";
import RenderVideo from "./RenderVideo";

interface VideoComponentProps {
	path: string;
	className?: string;
	commentId?: string;
}

const VideoComponent = ({ path, className, commentId }: VideoComponentProps) => {
	const [isError, setIsError] = useState(!path?.length);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		setIsError(!path?.length);
	}, [path]);

	return (
		<div
			className={cn(
				className,
				"w-full",

				"has-[iframe]:aspect-video",
				"has-[iframe]:h-full",
				"has-[iframe]:mb-2",
				"has-[iframe]:[&>div]:h-full",

				"[&_.error-text-parent]:overflow-hidden",

				"[&>.skeleton]:aspect-video",
				"[&>.skeleton]:h-full",

				"[&_iframe]:flex",
				"[&_iframe]:h-full",
				"[&_iframe]:w-full",
			)}
			data-type="video"
		>
			<BlockCommentView commentId={commentId}>
				<Skeleton height="100%" isLoaded={isError || isLoaded} style={{ height: "100%" }} width="100%">
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
