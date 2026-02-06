import { getExecutingEnvironment } from "@app/resolveModule/env";
import type HTMLComponents from "../../../../core/render/components/getComponents/HTMLComponents";

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
				{renderImage && <img data-component="image" src={src} />}
				{props.title && <em>{props.title}</em>}
			</div>
		);
	};
};

export default HTMLImage;
