import Caption from "@components/controls/Caption";
import useWatch from "@core-ui/hooks/useWatch";
import toggleSignature from "@core-ui/toggleSignature";
import Path from "@core/FileProvider/Path/Path";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import ImageActions from "@ext/markdown/elements/image/edit/components/ImageActions";
import ImageEditor from "@ext/markdown/elements/image/edit/components/ImageEditor";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import ImageRenderer from "@ext/markdown/elements/image/render/components/ImageRenderer";
import { getBlobFromBuffer } from "@ext/markdown/elements/image/render/logic/cropImage";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { NodeSelection } from "@tiptap/pm/state";
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
	const resourceService = ResourceService.value;

	const isEditable = editor.isEditable;

	const signatureRef = useRef<HTMLInputElement>(null);
	const [hasSignature, setHasSignature] = useState(isEditable && node.attrs?.title?.length > 0);
	const [isHovered, setIsHovered] = useState(false);
	const isGif = new Path(node.attrs.src).extension == "gif";
	const showResizer = selected && isEditable;

	useWatch(() => {
		if (!hasSignature && node.attrs?.title?.length) return setHasSignature(true);
	}, [node.attrs.title]);

	const focusToSignature = useCallback(() => {
		if (!hasSignature) signatureRef.current?.focus();
	}, [hasSignature]);

	const addSignature = useCallback(() => {
		setHasSignature((prev) => toggleSignature(prev, signatureRef.current, updateAttributes));
		focusToSignature();
	}, [node, signatureRef, updateAttributes, focusToSignature]);

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

		const buffer = resourceService.getBuffer(node.attrs.src);
		const blob = getBlobFromBuffer(buffer);
		const src = URL.createObjectURL(blob);

		const root = createRoot(element);
		root.render(
			<ImageEditor
				src={src}
				crop={node?.attrs?.crop ?? { x: 0, y: 0, w: 100, h: 100 }}
				objects={node?.attrs?.objects ?? []}
				handleSave={handleSave}
				handleToggle={handleToggle}
			/>,
		);
	}, [updateAttributes, node.attrs, resourceService.data]);

	const toInline = useCallback(() => {
		const position = getPos();
		if (position === undefined) return;

		const tr = editor.view.state.tr;
		const nodePos = position;
		const currentNode = tr.doc.nodeAt(nodePos);

		if (!currentNode) return;

		const inlineImageNode = editor.view.state.schema.nodes.inlineImage.create({
			src: currentNode.attrs.src,
			alt: currentNode.attrs.alt,
			width: currentNode.attrs.width,
			height: currentNode.attrs.height,
		});

		const $pos = tr.doc.resolve(nodePos);
		const nodeIndex = $pos.index();

		if (nodeIndex > 0) {
			const beforeNode = $pos.parent.child(nodeIndex - 1);

			if (beforeNode && beforeNode.type.name === "paragraph") {
				let beforeNodeStart = $pos.start();
				for (let i = 0; i < nodeIndex - 1; i++) {
					beforeNodeStart += $pos.parent.child(i).nodeSize;
				}

				const paragraphEnd = beforeNodeStart + beforeNode.nodeSize - 1;

				tr.delete(nodePos, nodePos + currentNode.nodeSize);

				tr.insert(paragraphEnd, inlineImageNode);
			} else {
				const paragraphNode = editor.view.state.schema.nodes.paragraph.create({}, inlineImageNode);
				tr.replaceWith(nodePos, nodePos + currentNode.nodeSize, paragraphNode);
			}
		} else {
			const paragraphNode = editor.view.state.schema.nodes.paragraph.create({}, inlineImageNode);
			tr.replaceWith(nodePos, nodePos + currentNode.nodeSize, paragraphNode);
		}

		tr.setSelection(NodeSelection.create(tr.doc, nodePos - 1));
		tr.setMeta("ignoreDeleteNode", true);

		editor.view.dispatch(tr);
	}, [editor, getPos, node]);

	const handleDelete = useCallback(() => {
		const position = getPos();
		editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
	}, [editor, getPos, node]);

	const onLoseFocus = useCallback(
		(e) => {
			const target = e.target as HTMLInputElement;
			if (target.value.length || hasSignature) return;

			updateAttributes({ title: "" });
			return setHasSignature(false);
		},
		[updateAttributes, hasSignature],
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
				isHovered={isHovered}
				setIsHovered={setIsHovered}
				rightActions={
					isEditable && (
						<ImageActions
							isGif={isGif}
							handleEdit={handleEdit}
							handleDelete={handleDelete}
							addSignature={addSignature}
							toInline={toInline}
						/>
					)
				}
			/>
			<Caption
				editor={editor}
				getPos={getPos}
				ref={signatureRef}
				text={node.attrs.title}
				onUpdate={onUpdate}
				onLoseFocus={onLoseFocus}
				visible={hasSignature}
			/>
		</>
	);
};

export default Image;
