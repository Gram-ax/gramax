import resolveModule from "@app/resolveModule/frontend";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
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
}

const Image = (props: ImageDataProps): ReactElement => {
	const { src } = props;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const imageSrc = apiUrlCreator ? resolveModule("useImage")(apiUrlCreator?.getArticleResource(src)) : "";

	return <ImageRenderer {...props} src={imageSrc} realSrc={src} />;
};

export default Image;
