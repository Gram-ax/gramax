import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import ImageRenderer from "@ext/markdown/elements/image/render/components/ImageRenderer";
import { ReactElement } from "react";

interface ImageDataProps {
	src: string;
	alt?: string;
	title?: string;
	crop?: Crop;
	objects?: ImageObject[];
	id?: string;
	width?: string;
	height?: string;
	readFromHead?: boolean;
}

const Image = (props: ImageDataProps): ReactElement => {
	const articleProps = ArticlePropsService.value;
	const { src } = props;
	return <ImageRenderer {...props} key={src + articleProps?.logicPath} realSrc={src} />;
};

export default Image;
