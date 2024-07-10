import { getExecutingEnvironment } from "@app/resolveModule/env";
import { GifImage } from "@components/Atoms/Image/GifImage";
import styled from "@emotion/styled";
import { useState, type HTMLAttributes } from "react";
import ErrorVideo from "./ErrorVideo";

export type RenderVideoProps = {
	url: string;
};

export type PreviewVideoProps = RenderVideoProps &
	HTMLAttributes<HTMLAnchorElement> & {
		previewUrl: string;
	};

const agent = typeof window !== "undefined" && window.navigator?.userAgent;
const isCredentiallessUnsupported = getExecutingEnvironment() == "browser" && !agent.includes("Chrome");

const SupportedVideoHostings: { [key: string]: (url: string) => JSX.Element } = {
	"youtube.com": (url) => {
		const id = url.match(/youtube.com\/watch\?v=(.*?)&/)?.[1];
		return isCredentiallessUnsupported ? (
			<PreviewVideo url={url} previewUrl={`https://img.youtube.com/vi/${id}/maxresdefault.jpg`} />
		) : (
			<IFrameVideo url={`https://www.youtube-nocookie.com/embed/${id}`} />
		);
	},
	"youtu.be": (url) => {
		const rel = url.match(/youtu\.be\/(.*)/)?.[1].replace("?t=", "?start=");
		const videoId = rel.match(/(.*)\?/)?.[1];
		return isCredentiallessUnsupported ? (
			<PreviewVideo url={url} previewUrl={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} />
		) : (
			<IFrameVideo url={`https://www.youtube-nocookie.com/embed/${rel}`} />
		);
	},
	"drive.google.com": (url) => {
		return isCredentiallessUnsupported ? (
			<PreviewVideo url={url} previewUrl="/images/gdrive.png" />
		) : (
			<IFrameVideo url={url.replace("view", "preview")} />
		);
	},
	"mega.nz": (url) =>
		isCredentiallessUnsupported ? (
			<PreviewVideo url={url} previewUrl="/images/meganz.png" />
		) : (
			<IFrameVideo url={url.replace(`/file/`, `/embed/`)} />
		),
	"dropbox.com": (url) => <RawVideo url={url.replace("?dl=0", "?raw=1")} />,
	"rutube.ru": (url) =>
		isCredentiallessUnsupported ? (
			<PreviewVideo url={url} previewUrl="/images/rutube.png" />
		) : (
			<IFrameVideo url={url.replace("video", "play/embed")} />
		),
	// "sharepoint.com": (link) => <VideoTag link={link.replace(/\?e=.*?$/, "?download=1")} />,
};

const PreviewVideoUnstyled = ({ url, previewUrl, className, ...props }: PreviewVideoProps) => {
	return (
		<a {...props} className={"video-js " + className} href={url} target="_blank" rel="noreferrer">
			<GifImage noplay src={previewUrl} />
		</a>
	);
};

const PreviewVideo = styled(PreviewVideoUnstyled)`
	position: relative;
	display: inline;
	width: fit-content;
	height: fit-content;
`;

const IFrameVideo = ({ url }: RenderVideoProps) => {
	const [isError, setIsError] = useState(false);

	const props = {
		credentialless: "true",
		width: "640",
		height: "480",
		allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
		allowFullScreen: true,
	};

	return isError ? (
		<ErrorVideo link={url} isLink />
	) : (
		<iframe
			onError={() => {
				console.log("asdf");

				setIsError(true);
			}}
			data-focusable="true"
			className="video-js"
			style={{ border: "none" }}
			src={url}
			{...props}
		/>
	);
};

const RawVideo = ({ url }: RenderVideoProps) => {
	const [isError, setIsError] = useState(false);

	return isError ? (
		<ErrorVideo link={url} isLink />
	) : (
		<video
			id="my-player"
			data-focusable="true"
			className="video-js"
			controls
			preload="auto"
			data-setup="{}"
			src={url}
			onError={() => setIsError(true)}
		/>
	);
};

const RenderVideo = ({ url }: RenderVideoProps) =>
	Object.entries(SupportedVideoHostings).find(([name]) => url.includes(name))?.[1](url) ?? <RawVideo url={url} />;

export default RenderVideo;
