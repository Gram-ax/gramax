import { ArticleComponentResizer } from "@ext/article/Components/ArticleComponentResizer";
import t from "@ext/localization/locale/translate";
import getVideoLayout from "@ext/markdown/elements/video/logic/getVideoLayout";
import VideoComponent from "./VideoComponent";
import { getVideoResizerClassName } from "./videoComponentStyles";

interface VideoProps {
	path: string;
	title: string;
	noEm?: boolean;
	commentId?: string;
	isPrint?: boolean;
	scale?: number | string;
	/** In the editor the resizer is rendered by EditVideo around the whole node view. */
	inEditor?: boolean;
}

const Video = ({ path, title, noEm, isPrint, commentId, scale, inEditor }: VideoProps) => {
	if (isPrint)
		return (
			<a data-type="video" href={path} rel="noreferrer" target="_blank">
				{t("editor.video.name")}
				{title && !noEm && <span>:{title}</span>}
			</a>
		);

	const layout = getVideoLayout(path);
	const video = <VideoComponent className="video-component" commentId={commentId} path={path} />;

	return (
		<div data-component="video" data-resize-container data-type="video">
			{inEditor ? (
				video
			) : (
				<ArticleComponentResizer
					className={getVideoResizerClassName(layout)}
					defaultScale={layout === "vertical" ? undefined : "100%"}
					disabled
					isPrint={isPrint}
					scale={scale}
				>
					{video}
				</ArticleComponentResizer>
			)}
			{title && !noEm && <em>{title}</em>}
		</div>
	);
};

export default Video;
