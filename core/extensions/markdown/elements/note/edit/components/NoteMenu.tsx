import Input from "@components/Atoms/Input";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import NoteAttrs from "@ext/markdown/elements/note/edit/model/NoteAtrrs";
import { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import getFocusNode from "@ext/markdown/elementsUtils/getFocusNode";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { ChangeEvent, FocusEvent, useEffect, useState } from "react";
import Note from "./NoteButtons";

const conditionalRendering = ({ editor }: { editor: Editor }) => {
	const { isActive } = ButtonStateService.useCurrentAction({ action: "note" });

	return isActive && <NoteMenu editor={editor} />;
};

const NoteMenu = ({ editor }: { editor: Editor }) => {
	const [node, setNode] = useState<Node>(null);
	const [type, setType] = useState(NoteType.note);
	const [title, setTitle] = useState("");
	const [expanded, dispatchExpanded] = useState(false);
	const second_title = t("more");
	const tooltipText = t("collapse");

	useEffect(() => {
		const { node: newNode } = getFocusNode(editor.state, (node) => node.type.name === "note");
		if (!node || newNode) {
			setNode(newNode);
			if (newNode) {
				setType(newNode.attrs.type);
				setTitle(newNode.attrs.title);
				dispatchExpanded(newNode.attrs.collapsed);
			}
		}
	}, [editor.state.selection]);

	const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
		setTitle(e.target.value);
		editor.commands.updateAttributes(node.type, { title: e.target.value });
	};

	const handleSetType = (type: NoteType) => {
		setType(type);
		editor.commands.updateAttributes(node.type, { type });
	};

	const handleToggleExpanded = () => {
		const props: NoteAttrs = { collapsed: !expanded };

		if (!title && !expanded) props.title = second_title;

		dispatchExpanded(!expanded);
		editor.commands.updateAttributes(node.type, props);
	};

	const handleOnBlur = (e: FocusEvent<HTMLInputElement>) => {
		if (expanded && !e.target.value) {
			dispatchExpanded(false);
			editor.commands.updateAttributes(node.type, { collapsed: false });
		}
	};

	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<Input
					value={title}
					onBlur={(e) => handleOnBlur(e)}
					onChange={handleTitleChange}
					placeholder={t("title")}
				/>
				<div className="divider" />
				<Note title={title} editor={editor} type={type} setType={handleSetType} />
				<div className="divider" />
				<Button
					icon={expanded ? "square-check" : "square"}
					tooltipText={tooltipText}
					onClick={handleToggleExpanded}
				/>
				<Button
					icon={"trash"}
					tooltipText={t("delete")}
					onClick={() => editor.chain().focus().deleteNode("note").run()}
				/>
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default conditionalRendering;
