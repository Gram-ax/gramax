import { useState } from "react";
import Hosting from "../../edit/model/Hosting";
import ErrorVideo from "./ErrorVideo";
import IframeTag from "./IframeTag";

const Hostings: { [hostin in Hosting]: (link: string) => JSX.Element } = {
	"youtube.com": (link) => {
		const videoHash = link.match(/youtube.com\/watch\?v=(.*?)&/)?.[1];
		return <IframeTag link={`https://www.youtube-nocookie.com/embed/${videoHash}`} />;
	},
	"youtu.be": (link) => {
		const videoHash = link.match(/youtu\.be\/(.*)/)?.[1].replace("?t=", "?start=");
		return <IframeTag link={`https://www.youtube-nocookie.com/embed/${videoHash}`} />;
	},
	"drive.google.com": (link) => <IframeTag link={link.replace("view", "preview")} />,
	"mega.nz": (link) => <IframeTag link={link.replace(`/file/`, `/embed/`)} />,
	"dropbox.com": (link) => <VideoTag link={link.replace("?dl=0", "?raw=1")} />,
	// "sharepoint.com": (link) => <VideoTag link={link.replace(/\?e=.*?$/, "?download=1")} />,
};

const VideoTag = ({ link }: { link: string }) => {
	const [isError, setIsError] = useState(false);

	return isError ? (
		<ErrorVideo link={link} isLink />
	) : (
		<video
			id="my-player"
			data-focusable="true"
			className="video-js"
			controls
			preload="auto"
			data-setup="{}"
			src={link}
			onError={() => setIsError(true)}
		/>
	);
};

const RenderLinkVideo = ({ link }: { link: string }) => {
	const hostingNames = Object.keys(Hosting);
	for (const hostingName of hostingNames) {
		if (link.includes(hostingName)) return Hostings[hostingName](link);
	}

	return <VideoTag link={link} />;
};

export default RenderLinkVideo;
