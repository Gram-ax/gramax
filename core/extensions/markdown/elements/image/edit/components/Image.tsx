import { resolveImageKind } from "@components/Atoms/Image/resolveImageKind";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import ImageRenderer from "@ext/markdown/elements/image/render/components/ImageRenderer";
import { ReactElement, useState } from "react";

interface ImageDataProps {
	src: string;
	alt?: string;
	title?: string;
	crop?: Crop;
	objects?: ImageObject[];
	id?: string;
	className?: string;
}

const Image = (props: ImageDataProps): ReactElement => {
	const { src } = props;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [imageSrc, setImageSrc] = useState<string>(null);

	const setSrc = (newSrc: Blob) => {
		if (imageSrc) URL.revokeObjectURL(imageSrc);
		setImageSrc(URL.createObjectURL(newSrc));
	};

	OnLoadResourceService.useGetContent(src, apiUrlCreator, (buffer: Buffer) => {
		if (!buffer) return;
		setSrc(new Blob([buffer], { type: resolveImageKind(buffer) }));
	});

	return imageSrc && <ImageRenderer {...props} setSrc={setSrc} src={imageSrc} realSrc={src} />;
};

export default Image;
