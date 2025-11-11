import React from "react";
import HTMLComponents from "../../../../core/render/components/getComponents/HTMLComponents";
import { getExecutingEnvironment } from "@app/resolveModule/env";

export interface HTMLImageProps {
	src: string;
	title?: string;
}

const renderImage = getExecutingEnvironment() === "next";

const HTMLImage = (html: HTMLComponents) => {
	return (props: HTMLImageProps) => {
		const src = html.getApiArticleResource(props.src);
		return (
			<div>
				{renderImage && <img src={src} data-component="image" />}
				{props.title && <em>{props.title}</em>}
			</div>
		);
	};
};

export default HTMLImage;
