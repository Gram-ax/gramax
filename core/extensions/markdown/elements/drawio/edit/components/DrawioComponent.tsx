import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useState } from "react";
import Focus from "../../../../elementsUtils/wrappers/Focus";
import Drawio from "../../render/component/Drawio";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import { resolveImageKind } from "@components/Atoms/Image/resolveImageKind";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import getDrawioID from "@ext/markdown/elements/drawio/edit/logic/getDrawioID";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";

const DrawioComponent = ({ node, getPos }: NodeViewProps): ReactElement => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const articleProps = ArticlePropsService.value;
	const [imageSrc, setImageSrc] = useState<string>(null);

	const setSrc = (newSrc: Blob) => {
		if (imageSrc) URL.revokeObjectURL(imageSrc);
		setImageSrc(URL.createObjectURL(newSrc));
	};

	OnLoadResourceService.useGetContent(node.attrs.src, apiUrlCreator, (buffer) => {
		if (!buffer.byteLength) return;
		setSrc(new Blob([buffer], { type: resolveImageKind(buffer) }));
	});

	const openEditor = () => {
		ModalToOpenService.setValue(ModalToOpen.DrawioEditor, {
			src: node.attrs.src,
			logicPath: articleProps.logicPath,
		});
	};

	return (
		<NodeViewWrapper as={"div"} draggable={true} data-drag-handle>
			<Focus getPos={getPos}>
				<Drawio
					id={getDrawioID(node.attrs.src, articleProps.logicPath)}
					openEditor={openEditor}
					realSrc={node.attrs.src}
					src={imageSrc}
					title={node.attrs.title}
				/>
			</Focus>
		</NodeViewWrapper>
	);
};
export default DrawioComponent;
