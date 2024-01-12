import Input from "@components/Atoms/Input";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { useEffect, useState } from "react";

const ImageMenu = ({ editor }: { editor: Editor }) => {
	const [node, setNode] = useState<Node>(null);
	const [title, setTitle] = useState("");
	const [position, setPosition] = useState<number>(null);

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
		if (node) {
			editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
		}
	};

	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<Input placeholder="Подпись" value={title} onChange={handleTitleChange} />
				<div className="divider" />
				<Button icon={"trash"} tooltipText={"Удалить"} onClick={handleDelete} />
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default ImageMenu;
