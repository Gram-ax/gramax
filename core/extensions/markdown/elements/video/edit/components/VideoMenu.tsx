import Input from "@components/Atoms/Input";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { useEffect, useState, ChangeEvent } from "react";

const VideoMenu = ({ editor }: { editor: Editor }) => {
	const [node, setNode] = useState<Node>(null);
	const [path, setPath] = useState("");
	const [title, setTitle] = useState("");
	const [position, setPosition] = useState<number>(null);

	useEffect(() => {
		const { node, position } = getFocusNode(editor.state, (node) => node.type.name === "video");
		if (node) {
			setNode(node);
			setPath(node.attrs?.path);
			setTitle(node.attrs?.title);
		}
		if (position) setPosition(position);
	}, [editor.state.selection]);

	if (!editor.isActive("video")) return null;

	const handlePathChange = (e: ChangeEvent<HTMLInputElement>) => {
		setPath(e.target.value);
		editor.commands.updateAttributes(node.type, { path: e.target.value });
	};

	const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setTitle(e.target.value);
		editor.commands.updateAttributes(node.type, { title: e.target.value });
	};

	const handleDelete = () => {
		if (position !== null && node) {
			editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
		}
	};

	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<Input placeholder="Ссылка на видео" value={path} onChange={handlePathChange} />
				<div className="divider" />
				<Input placeholder="Подпись" value={title} onChange={handleTitleChange} />
				<div className="divider" />
				<Button icon={"trash"} tooltipText={"Удалить"} onClick={handleDelete} />
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default VideoMenu;
