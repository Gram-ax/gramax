import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ImageEditor from "@ext/markdown/elements/image/edit/components/ImageEditor";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import ImageRenderer from "@ext/markdown/elements/image/render/components/ImageRenderer";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { ReactElement } from "react";
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

	return (
		<ImageRenderer
			selected={selected}
			scale={node.attrs.scale}
			alt={node?.attrs?.alt}
			crop={node?.attrs?.crop}
			title={node?.attrs?.title}
			objects={node?.attrs?.objects}
			openEditor={openEditor}
			realSrc={node?.attrs?.src}
			updateAttributes={updateAttributes}
		/>
	);
};

export default Image;
