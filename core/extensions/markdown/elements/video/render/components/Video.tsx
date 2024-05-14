import Fetcher from "@core-ui/ApiServices/Types/Fetcher";
import UseSWRService from "@core-ui/ApiServices/UseSWRService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ErrorVideo from "./ErrorVideo";
import RenderVideo from "./RenderVideo";

const Video = ({ path, title, isLink }: { path: string; title: string; isLink: boolean }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const url = apiUrlCreator?.getVideoUrl(path);
	const { data, error } = UseSWRService.getData<{ url: string }>(url, Fetcher.json, !isLink);

	const Video = isLink ? (
		<RenderVideo url={path} />
	) : (
		<video
			controls
			id="my-player"
			preload="auto"
			data-focusable="true"
			data-setup="{}"
			className="video-js"
			src={data?.url}
		/>
	);

	return (
		<span data-type="video">
			{!path || error ? <ErrorVideo isLink={false} link={path} isNoneError={!path} /> : Video}
			{title ? <em>{title}</em> : null}
		</span>
	);
};

export default Video;
