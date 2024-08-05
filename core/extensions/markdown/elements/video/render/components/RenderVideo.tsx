import { getExecutingEnvironment } from "@app/resolveModule/env";
import { GifImage } from "@components/Atoms/Image/GifImage";
import styled from "@emotion/styled";
import { type HTMLAttributes } from "react";

export type RenderVideoProps = {
	url: string;
	setIsError: (isError: boolean) => void;
};

export type PreviewVideoProps = Omit<RenderVideoProps, "setIsError"> &
	HTMLAttributes<HTMLAnchorElement> & {
		previewUrl: string;
	};

const agent = typeof window !== "undefined" && window.navigator?.userAgent;
const isCredentiallessUnsupported = getExecutingEnvironment() == "browser" && !agent.includes("Chrome");

const SupportedVideoHostings: {
	[key: string]: (url: string, setIsError: (isError: boolean) => void) => JSX.Element;
} = {
	"youtube.com": (url, setIsError) => {
		const id = url.match(/v=([^&]+)/)?.[1];
		return isCredentiallessUnsupported ? (
			<PreviewVideo url={url} previewUrl={`https://img.youtube.com/vi/${id}/maxresdefault.jpg`} />
		) : (
			<IFrameVideo url={`https://www.youtube-nocookie.com/embed/${id}`} setIsError={setIsError} />
		);
	},
	"youtu.be": (url, setIsError) => {
		const rel = url.match(/youtu\.be\/(.*)/)?.[1].replace("?t=", "?start=");
		if (!rel) return null;
		const videoId = rel.match(/(.*)\?/)?.[1];
		return isCredentiallessUnsupported ? (
			<PreviewVideo url={url} previewUrl={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} />
		) : (
			<IFrameVideo url={`https://www.youtube-nocookie.com/embed/${rel}`} setIsError={setIsError} />
		);
	},
	"drive.google.com": (url, setIsError) => {
		return isCredentiallessUnsupported ? (
			<PreviewVideo url={url} previewUrl={"/images/gdrive.png"} />
		) : (
			<IFrameVideo url={url.replace("view", "preview")} setIsError={setIsError} />
		);
	},
	"mega.nz": (url, setIsError) =>
		isCredentiallessUnsupported ? (
			<PreviewVideo url={url} previewUrl={"/images/meganz.png"} />
		) : (
			<IFrameVideo url={url.replace(`/file/`, `/embed/`)} setIsError={setIsError} />
		),
	"dropbox.com": (url, setIsError) => (
		<IFrameVideo
			url={url.replace(url.includes("?dl=0") ? "?dl=0" : "&dl=0", url.includes("?dl=0") ? "?raw=1" : "&raw=1")}
			setIsError={setIsError}
		/>
	),
	"rutube.ru": (url, setIsError) =>
		isCredentiallessUnsupported ? (
			<PreviewVideo url={url} previewUrl={"/images/rutube.png"} />
		) : (
			<IFrameVideo url={url.replace("video", "play/embed")} setIsError={setIsError} />
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

const IFrameVideo = ({ url, setIsError: setIsError }: RenderVideoProps) => {
	const props = {
		credentialless: "true",
		width: "640",
		height: "480",
		allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
		allowFullScreen: true,
	};

	return (
		<iframe
			onError={() => {
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

const RawVideo = ({ url, setIsError: setIsError }: RenderVideoProps) => {
	return (
		<video
			id="my-player"
			data-focusable="true"
			className="video-js"
			controls
			preload="auto"
			data-setup="{}"
			src={url}
			onError={() => {
				setIsError(true);
			}}
		/>
	);
};

const RenderVideo = ({ url, setIsError: setIsError }: RenderVideoProps) =>
	Object.entries(SupportedVideoHostings).find(([name]) => url.includes(name))?.[1](url, setIsError) ?? (
		<RawVideo url={url} setIsError={setIsError} />
	);

export default RenderVideo;
