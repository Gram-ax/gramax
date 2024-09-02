import Input from "@components/Atoms/Input";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { ChangeEvent, useEffect, useState } from "react";
import getFocusNode from "../../../../elementsUtils/getFocusNode";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";

const DiagramsMenu = ({ editor }: { editor: Editor }) => {
	const [node, setNode] = useState<Node>(null);
	const [title, setTitle] = useState("");
	const [position, setPosition] = useState<number>(null);

	useEffect(() => {
		const { node: focusNode, position: focusPosition } = getFocusNode(
			editor.state,
			(node) => node.type.name === "diagrams",
		);
		if (focusNode) {
			setNode(focusNode);
			setTitle(focusNode.attrs?.title ?? "");
		}
		if (typeof focusPosition === "number") setPosition(focusPosition);
	}, [editor.state.selection]);

	if (!editor.isActive("diagrams")) return null;

	const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setTitle(e.target.value);
		editor.commands.updateAttributes(node.type, { title: e.target.value });
	};

	const handleDelete = () => {
		if (!node) return;
		editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
	};

	const openEditor = () => {
		ModalToOpenService.setValue(ModalToOpen.DiagramEditor, {
			editor,
			content: OnLoadResourceService.getBuffer(node.attrs.src).toString(),
			src: node.attrs.src,
			diagramName: node.attrs.diagramName,
			onClose: () => ModalToOpenService.resetValue(),
		});
	};

	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<Input placeholder={t("signature")} value={title} onChange={handleTitleChange} />
				<div className="divider" />
				<Button icon={"pencil"} tooltipText={t("edit2")} onClick={openEditor} />
				<Button icon="trash" tooltipText={t("delete")} onClick={handleDelete} />
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default DiagramsMenu;
