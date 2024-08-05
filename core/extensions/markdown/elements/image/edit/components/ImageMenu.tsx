import Input from "@components/Atoms/Input";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import ImageEditor from "@ext/markdown/elements/image/edit/components/ImageEditor/index";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
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
	const messages = [t("edit2"), t("delete")];

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
		}
	};

	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<Input placeholder={t("signature")} value={title} onChange={handleTitleChange} />
				<div className="divider" />
				<Button icon={"pen"} tooltipText={messages[0]} onClick={handleEdit} />
				<Button icon={"trash"} tooltipText={messages[1]} onClick={handleDelete} />
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default ImageMenu;
