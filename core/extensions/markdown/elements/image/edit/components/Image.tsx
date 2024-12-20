import Signature from "@components/controls/Signature";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import Path from "@core/FileProvider/Path/Path";
import ImageActions from "@ext/markdown/elements/image/edit/components/ImageActions";
import ImageEditor from "@ext/markdown/elements/image/edit/components/ImageEditor";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import ImageRenderer from "@ext/markdown/elements/image/render/components/ImageRenderer";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { ReactElement, RefObject, useCallback, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

interface ImageDataProps {
	editor: Editor;
	node: Node;
	selected: boolean;
	getPos: () => number;
	hoverElementRef: RefObject<HTMLDivElement>;
	updateAttributes?: (attributes: Record<string, any>) => void;
	className?: string;
}

const Image = (props: ImageDataProps): ReactElement => {
	const { node, editor, getPos, hoverElementRef, updateAttributes, selected } = props;
	const readFromHead = editor.storage.diff?.isOldEditor;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isEditable = editor.isEditable;

	const signatureRef = useRef<HTMLInputElement>(null);
	const [hasSignature, setHasSignature] = useState(isEditable && node.attrs?.title?.length > 0);
	const [isHovered, setIsHovered] = useState(false);
	const isGif = new Path(node.attrs.src).extension == "gif";
	const showResizer = isHovered || selected;

	const addSignature = useCallback(() => {
		if (!hasSignature) setHasSignature(true);
		signatureRef.current?.focus();
	}, [hasSignature]);

	const handleEdit = useCallback(() => {
		if (!node) return;
		const handleSave = (objects: ImageObject[], crop: Crop) => {
			updateAttributes({ crop, objects });
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
					src={apiUrlCreator.getArticleResource(node?.attrs?.src)}
					crop={node?.attrs?.crop ?? { x: 0, y: 0, w: 100, h: 100 }}
					objects={node?.attrs?.objects ?? []}
					handleSave={handleSave}
					handleToggle={handleToggle}
				/>
			</ApiUrlCreatorService.Provider>,
		);
	}, [updateAttributes, node.attrs, apiUrlCreator]);

	const handleDelete = useCallback(() => {
		const position = getPos();
		editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
	}, [editor, getPos, node]);

	const onLoseFocus = useCallback(
		(e) => {
			const target = e.target as HTMLInputElement;
			if (target.value.length) return;

			updateAttributes({ title: "" });
			return setHasSignature(false);
		},
		[updateAttributes],
	);

	const onUpdate = useCallback((text) => updateAttributes({ title: text }), [updateAttributes]);

	return (
		<>
			<ImageRenderer
				{...node.attrs}
				noEm
				hoverElementRef={hoverElementRef}
				showResizer={showResizer}
				openEditor={handleEdit}
				realSrc={node?.attrs?.src}
				updateAttributes={updateAttributes}
				readFromHead={readFromHead}
				isHovered={isHovered}
				setIsHovered={setIsHovered}
				rightActions={
					isEditable && (
						<ImageActions
							isGif={isGif}
							handleEdit={handleEdit}
							handleDelete={handleDelete}
							addSignature={addSignature}
						/>
					)
				}
			/>
			<Signature
				editor={editor}
				getPos={getPos}
				ref={signatureRef}
				autoFocus={node.attrs.title?.length === 0}
				text={node.attrs.title}
				onUpdate={onUpdate}
				onLoseFocus={onLoseFocus}
				visible={hasSignature}
			/>
		</>
	);
};

export default Image;
