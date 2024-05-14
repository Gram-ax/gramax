import Input from "@components/Atoms/Input";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useLocalize from "@ext/localization/useLocalize";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import ImageEditor from "@ext/markdown/elements/image/edit/components/ImageEditor/index";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import linkCreator from "@ext/markdown/elements/link/render/logic/linkCreator";
import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const ImageMenu = ({ editor }: { editor: Editor }) => {
	const [node, setNode] = useState<Node>(null);
	const [title, setTitle] = useState("");
	const [position, setPosition] = useState<number>(null);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const messages = [useLocalize("edit2"), useLocalize("delete")];

	useEffect(() => {
		const { node, position } = getFocusNode(editor.state, (node) => node.type.name === "image");
		if (node) {
			setNode(node);
			setTitle(node.attrs?.title ?? "");
		}
		if (typeof position === "number") setPosition(position);
	}, [editor.state.selection]);

	if (!editor.isActive("image")) return null;

	const handleTitleChange = (event) => {
		setTitle(event.target.value);
		editor.commands.updateAttributes(node.type, { title: event.target.value });
	};

	const handleDelete = () => {
		if (!node) return;
		editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
	};

	const url =
		(linkCreator.isExternalLink(node?.attrs?.src) && node?.attrs?.src) ||
		apiUrlCreator.getArticleResource(node?.attrs?.src);

	const handleEdit = () => {
		if (node) {
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
				<ImageEditor
					imageProps={{
						alt: node?.attrs?.alt,
						title: node?.attrs?.title,
						src: url,
						objects: node?.attrs?.objects !== "undefined" ? node?.attrs?.objects : [],
						crop: node?.attrs?.crop,
					}}
					handleSave={handleSave}
					handleToggle={handleToggle}
				/>,
			);
		}
	};

	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<Input placeholder="Подпись" value={title} onChange={handleTitleChange} />
				<div className="divider" />
				{/* <Button icon={"pen"} tooltipText={messages[0]} onClick={handleEdit} /> */}
				<Button icon={"trash"} tooltipText={messages[1]} onClick={handleDelete} />
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default ImageMenu;
