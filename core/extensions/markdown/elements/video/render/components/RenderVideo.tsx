import { getExecutingEnvironment } from "@app/resolveModule/env";
import GifImage from "@components/Atoms/Image/GifImage";
import styled from "@emotion/styled";
import type { HTMLAttributes } from "react";
import { getUrlFileExtension } from "../../logic/getUrlFileExtension";

export type RenderVideoProps = {
	url: string;
	onLoad?: () => void;
	onError?: () => void;
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
	const extension = getUrlFileExtension(url);

	return extension ? supportedVideoFormats.includes(extension) : false;
};

const SupportedVideoHostings: {
	[key: string]: (url: string, onLoad: () => void, onError: () => void) => JSX.Element;
} = {
	"youtube.com": (url, onLoad, onError) => {
		const id = url.match(/v=([^&]+)/)?.[1];
		return isCredentiallessUnsupported ? (
			<PreviewVideo onLoad={onLoad} previewUrl={`https://img.youtube.com/vi/${id}/maxresdefault.jpg`} url={url} />
		) : (
			<IFrameVideo onError={onError} onLoad={onLoad} url={`https://youtube.com/embed/${id}`} />
		);
	},
	"youtu.be": (url, onLoad, onError) => {
		const rel = url.match(/youtu\.be\/(.*)/)?.[1].replace("?t=", "?start=");
		if (!rel) return null;
		const videoId = rel.match(/(.*)\?/)?.[1];
		return isCredentiallessUnsupported ? (
			<PreviewVideo
				onLoad={onLoad}
				previewUrl={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
				url={url}
			/>
		) : (
			<IFrameVideo onError={onError} onLoad={onLoad} url={`https://youtube.com/embed/${rel}`} />
		);
	},
	"drive.google.com": (url, onLoad, onError) => {
		return isCredentiallessUnsupported ? (
			<PreviewVideo onLoad={onLoad} previewUrl={"/images/gdrive.png"} url={url} />
		) : (
			<IFrameVideo onError={onError} onLoad={onLoad} url={url.replace("view", "preview")} />
		);
	},
	"mega.nz": (url, onLoad, onError) =>
		isCredentiallessUnsupported ? (
			<PreviewVideo onLoad={onLoad} previewUrl={"/images/meganz.png"} url={url} />
		) : (
			<IFrameVideo onError={onError} onLoad={onLoad} url={url.replace(`/file/`, `/embed/`)} />
		),
	"dropbox.com": (url, onLoad, onError) => {
		const processedUrl = url.replace(
			url.includes("?dl=0") ? "?dl=0" : "&dl=0",
			url.includes("?dl=0") ? "?raw=1" : "&raw=1",
		);

		return !isVideoFormatSupported(url) ? (
			<PreviewVideo onLoad={onLoad} previewUrl={"/images/dropbox.png"} url={url} />
		) : (
			<IFrameVideo onError={onError} onLoad={onLoad} url={processedUrl} />
		);
	},
	"rutube.ru": (url, onLoad, onError) =>
		isCredentiallessUnsupported ? (
			<PreviewVideo onLoad={onLoad} previewUrl={"/images/rutube.png"} url={url} />
		) : (
			<IFrameVideo onError={onError} onLoad={onLoad} url={rutubeUrlReplacer(url)} />
		),
	// "sharepoint.com": (link) => <VideoTag link={link.replace(/\?e=.*?$/, "?download=1")} />,
};

const PreviewVideoUnstyled = ({ url, previewUrl, className, onLoad, ...props }: PreviewVideoProps) => {
	return (
		<a {...props} className={"video-js " + className} href={url} rel="noreferrer" target="_blank">
			<GifImage noplay onLoad={onLoad} src={previewUrl} />
		</a>
	);
};

const PreviewVideo = styled(PreviewVideoUnstyled)`
	position: relative;
	display: inline;
	width: fit-content;
	height: fit-content;
`;

export const IFrameVideo = ({ url, onLoad, onError }: RenderVideoProps) => {
	const props = {
		credentialless: "true",
		allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
		allowFullScreen: true,
	};

	return (
		<iframe
			className="video-js focus-pointer-events"
			data-focusable="true"
			onError={onError}
			onLoad={onLoad}
			src={url}
			style={{ border: "none" }}
			{...props}
		/>
	);
};

const RawVideo = ({ url, onLoad, onError }: RenderVideoProps) => {
	return (
		<video
			className="video-js"
			controls
			crossOrigin="anonymous"
			data-focusable="true"
			data-setup="{}"
			id="my-player"
			onError={onError}
			onLoad={onLoad}
			onLoadedData={onLoad}
			preload="auto"
			src={url}
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

	if (url.includes("embed")) return <IFrameVideo onError={onError} onLoad={onLoad} url={url} />;

	return (
		Object.entries(SupportedVideoHostings).find(([name]) => url.includes(name))?.[1](url, onLoad, onError) ?? (
			<RawVideo onError={onError} onLoad={onLoad} url={url} />
		)
	);
};

export default RenderVideo;
