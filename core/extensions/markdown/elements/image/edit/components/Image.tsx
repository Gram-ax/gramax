import { resolveImageKind } from "@components/Atoms/Image/resolveImageKind";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import ImageEditor from "@ext/markdown/elements/image/edit/components/ImageEditor";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import ImageRenderer from "@ext/markdown/elements/image/render/components/ImageRenderer";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { ReactElement, useState } from "react";
import { createRoot } from "react-dom/client";

interface ImageDataProps {
	editor: Editor;
	node: Node;
	className?: string;
	selected?: boolean;
	updateAttributes?: (attributes: Record<string, any>) => void;
}

const Image = (props: ImageDataProps): ReactElement => {
	const { node, editor, selected, updateAttributes } = props;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [imageSrc, setImageSrc] = useState<string>(null);

	const setSrc = (newSrc: Blob) => {
		if (imageSrc) URL.revokeObjectURL(imageSrc);
		setImageSrc(URL.createObjectURL(newSrc));
	};

	OnLoadResourceService.useGetContent(node?.attrs?.src, apiUrlCreator, (buffer: Buffer) => {
		if (!buffer) return;
		setSrc(new Blob([buffer], { type: resolveImageKind(buffer) }));
	});

	const openEditor = () => {
		const handleSave = (objects: ImageObject[], crop: Crop) => {
			editor.commands.updateAttributes(node.type, { crop, objects });
		};

		const element = document.body.appendChild(document.createElement("div"));
		element.setAttribute("id", "image-editor");

		const handleToggle = () => {
			document.body.removeChild(element);
		};

		const root = createRoot(element);
		root.render(
			<ApiUrlCreatorService.Provider value={apiUrlCreator}>
				<ImageEditor
					alt={node?.attrs?.alt}
					title={node?.attrs?.title}
					src={apiUrlCreator.getArticleResource(node?.attrs?.src)}
					crop={node?.attrs?.crop ?? { x: 0, y: 0, w: 100, h: 100 }}
					objects={node?.attrs?.objects ?? []}
					handleSave={handleSave}
					handleToggle={handleToggle}
				/>
			</ApiUrlCreatorService.Provider>,
		);
	};

	if (!imageSrc) return null;
	return (
		<ImageRenderer
			selected={selected}
			scale={node.attrs.scale}
			alt={node?.attrs?.alt}
			crop={node?.attrs?.crop}
			title={node?.attrs?.title}
			objects={node?.attrs?.objects}
			setSrc={setSrc}
			openEditor={openEditor}
			src={imageSrc}
			realSrc={node?.attrs?.src}
			updateAttributes={updateAttributes}
		/>
	);
};

export default Image;
