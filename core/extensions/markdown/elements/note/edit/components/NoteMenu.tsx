import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { useEffect, useState, ChangeEvent } from "react";
import Input from "@components/Atoms/Input";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import Note from "./NoteButtons";

const NoteMenu = ({ editor }: { editor: Editor }) => {
	const [node, setNode] = useState<Node>(null);
	const [type, setType] = useState(NoteType.note);
	const [title, setTitle] = useState("");

	useEffect(() => {
		const { node: newNode } = getFocusNode(editor.state, (node) => node.type.name === "note");
		if (!node || (newNode && JSON.stringify(node.attrs) !== JSON.stringify(newNode.attrs))) {
			setNode(newNode);
			if (newNode) {
				setType(newNode.attrs.type ?? NoteType.note);
				setTitle(newNode.attrs.title ?? "");
			}
		}
	}, [editor.state.selection]);

	if (!editor.isActive("note")) return null;

	const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setTitle(e.target.value);
		editor.commands.updateAttributes(node.type, { title: e.target.value });
	};

	const handleSetType = (type: NoteType) => {
		setType(type);
		editor.commands.updateAttributes(node.type, { type });
	};

	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<Input placeholder="Заголовок" value={title} onChange={handleTitleChange} />
				<div className="divider" />
				<Note title={title} editor={editor} type={type} setType={handleSetType} />
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default NoteMenu;
