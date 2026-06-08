import t from "@ext/localization/locale/translate";
import VideoComponent from "./VideoComponent";

interface VideoProps {
	path: string;
	title: string;
	noEm?: boolean;
	commentId?: string;
	isPrint?: boolean;
}

const Video = ({ path, title, noEm, isPrint, commentId }: VideoProps) => {
	if (isPrint)
		return (
			<a data-type="video" href={path} rel="noreferrer" target="_blank">
				{t("editor.video.name")}
				{title && !noEm && <span>:{title}</span>}
			</a>
		);

	return (
		<div data-type="video">
			<VideoComponent className="video-component" commentId={commentId} path={path} />
			{title && !noEm && <em>{title}</em>}
		</div>
	);
};

export default Video;
