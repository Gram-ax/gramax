import RenderVideo from "@ext/markdown/elements/video/render/components/RenderVideo";
import React from "react";

export interface HTMLVideoProps {
	path?: string;
	title?: string;
	noEm?: boolean;
}

const HTMLVideo = (props: HTMLVideoProps) => (
	<div data-component="video">
		<RenderVideo url={props.path} />
		{props.title && !props.noEm && <em>{props.title}</em>}
	</div>
);

export default HTMLVideo;
