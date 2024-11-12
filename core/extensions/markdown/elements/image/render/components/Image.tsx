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
	readFromHead?: boolean;
}

const Image = (props: ImageDataProps): ReactElement => {
	const { src } = props;
	return <ImageRenderer {...props} realSrc={src} />;
};

export default Image;
