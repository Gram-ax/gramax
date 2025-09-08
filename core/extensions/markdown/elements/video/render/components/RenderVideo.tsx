import { getExecutingEnvironment } from "@app/resolveModule/env";
import GifImage from "@components/Atoms/Image/GifImage";
import styled from "@emotion/styled";
import { type HTMLAttributes } from "react";

export type RenderVideoProps = {
	url: string;
	onLoad: () => void;
	onError: () => void;
	setIsError?: (isError: boolean) => void;
	setIsLoaded?: (isLoaded: boolean) => void;
};

type RenderVideoPropsWithoutLoad = Omit<RenderVideoProps, "onLoad" | "onError">;

export type PreviewVideoProps = Omit<RenderVideoProps, "onLoad" | "onError"> &
	HTMLAttributes<HTMLAnchorElement> & {
		previewUrl: string;
		onLoad: () => void;
	};

const agent = typeof window !== "undefined" && window.navigator?.userAgent;
const isCredentiallessUnsupported = getExecutingEnvironment() === "browser" && !agent.includes("Chrome");

const rutubeUrlReplacer = (url: string): string => {
	if (url.includes("video/private")) return url.replace("video/private", "play/embed");
	return url.replace("video", "play/embed");
};

const supportedVideoFormats = ["mp4", "webm", "ogg"];

const isVideoFormatSupported = (url: string): boolean => {
	const extension = url.split(".").pop()?.toLowerCase();
	return extension ? supportedVideoFormats.includes(extension) : false;
};

const SupportedVideoHostings: {
	[key: string]: (url: string, onLoad: () => void, onError: () => void) => JSX.Element;
} = {
	"youtube.com": (url, onLoad, onError) => {
		const id = url.match(/v=([^&]+)/)?.[1];
		return isCredentiallessUnsupported ? (
			<PreviewVideo url={url} previewUrl={`https://img.youtube.com/vi/${id}/maxresdefault.jpg`} onLoad={onLoad} />
		) : (
			<IFrameVideo url={`https://youtube.com/embed/${id}`} onLoad={onLoad} onError={onError} />
		);
	},
	"youtu.be": (url, onLoad, onError) => {
		const rel = url.match(/youtu\.be\/(.*)/)?.[1].replace("?t=", "?start=");
		if (!rel) return null;
		const videoId = rel.match(/(.*)\?/)?.[1];
		return isCredentiallessUnsupported ? (
			<PreviewVideo
				url={url}
				previewUrl={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
				onLoad={onLoad}
			/>
		) : (
			<IFrameVideo url={`https://youtube.com/embed/${rel}`} onLoad={onLoad} onError={onError} />
		);
	},
	"drive.google.com": (url, onLoad, onError) => {
		return isCredentiallessUnsupported ? (
			<PreviewVideo url={url} previewUrl={"/images/gdrive.png"} onLoad={onLoad} />
		) : (
			<IFrameVideo url={url.replace("view", "preview")} onLoad={onLoad} onError={onError} />
		);
	},
	"mega.nz": (url, onLoad, onError) =>
		isCredentiallessUnsupported ? (
			<PreviewVideo url={url} previewUrl={"/images/meganz.png"} onLoad={onLoad} />
		) : (
			<IFrameVideo url={url.replace(`/file/`, `/embed/`)} onLoad={onLoad} onError={onError} />
		),
	"dropbox.com": (url, onLoad, onError) => {
		const processedUrl = url.replace(
			url.includes("?dl=0") ? "?dl=0" : "&dl=0",
			url.includes("?dl=0") ? "?raw=1" : "&raw=1",
		);

		return !isVideoFormatSupported(url) ? (
			<PreviewVideo url={url} previewUrl={"/images/dropbox.png"} onLoad={onLoad} />
		) : (
			<IFrameVideo url={processedUrl} onLoad={onLoad} onError={onError} />
		);
	},
	"rutube.ru": (url, onLoad, onError) =>
		isCredentiallessUnsupported ? (
			<PreviewVideo url={url} previewUrl={"/images/rutube.png"} onLoad={onLoad} />
		) : (
			<IFrameVideo url={rutubeUrlReplacer(url)} onLoad={onLoad} onError={onError} />
		),
	// "sharepoint.com": (link) => <VideoTag link={link.replace(/\?e=.*?$/, "?download=1")} />,
};

const PreviewVideoUnstyled = ({ url, previewUrl, className, onLoad, ...props }: PreviewVideoProps) => {
	return (
		<a {...props} className={"video-js " + className} href={url} target="_blank" rel="noreferrer">
			<GifImage noplay src={previewUrl} onLoad={onLoad} />
		</a>
	);
};

const PreviewVideo = styled(PreviewVideoUnstyled)`
	position: relative;
	display: inline;
	width: fit-content;
	height: fit-content;
`;

const IFrameVideo = ({ url, onLoad: onLoad, onError }: RenderVideoProps) => {
	const props = {
		credentialless: "true",
		allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
		allowFullScreen: true,
	};

	return (
		<iframe
			onError={onError}
			onLoad={onLoad}
			className="video-js focus-pointer-events"
			style={{ border: "none" }}
			data-focusable="true"
			src={url}
			{...props}
		/>
	);
};

const RawVideo = ({ url, onLoad, onError }: RenderVideoProps) => {
	return (
		<video
			id="my-player"
			data-focusable="true"
			className="video-js"
			controls
			preload="auto"
			data-setup="{}"
			src={url}
			onLoad={onLoad}
			onError={onError}
		/>
	);
};

const RenderVideo = ({ url, setIsError, setIsLoaded }: RenderVideoPropsWithoutLoad) => {
	const onError = () => {
		setIsError(true);
	};

	const onLoad = () => {
		setIsLoaded(true);
	};

	if (typeof url !== "string") return;
	if (url.includes("embed")) return <IFrameVideo url={url} onLoad={onLoad} onError={onError} />;

	return (
		Object.entries(SupportedVideoHostings).find(([name]) => url.includes(name))?.[1](url, onLoad, onError) ?? (
			<RawVideo url={url} onLoad={onLoad} onError={onError} />
		)
	);
};

export default RenderVideo;
