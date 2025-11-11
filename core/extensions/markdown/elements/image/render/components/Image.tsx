import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import ImageRenderer from "@ext/markdown/elements/image/render/components/ImageRenderer";
import AnnotationList from "@ext/markdown/elements/image/render/components/ImageEditor/AnnotationList";
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
	marginBottom?: string;
	float?: string;
	hasParentPath?: boolean;
	isPrint?: boolean;
}

const Image = (props: ImageDataProps): ReactElement => {
	const articleProps = ArticlePropsService.value;
	const { src, isPrint } = props;

	if (!isPrint) {
		return <ImageRenderer {...props} key={src + articleProps?.logicPath} realSrc={src} />;
	}

	return (
		<>
			<ImageRenderer {...props} key={src + articleProps?.logicPath} realSrc={src} />
			<AnnotationList objects={props.objects} />
		</>
	);
};

export default Image;
