import ButtonAtom from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import FileInput from "@components/Atoms/FileInput/FileInput";
import FormStyle from "@components/Form/FormStyle";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { useEffect, useState } from "react";
import getFocusNode from "../../../../elementsUtils/getFocusNode";

const HTMLEditButton = ({ content, editor }: { content?: string; editor: Editor }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [startContent, setStartContent] = useState(content ?? "");
	const [contentState, setContentState] = useState(content ?? "");
	const [contentEditState, setContentEditState] = useState(content ?? "");

	const saveContent = (newContent: string) => {
		editor.commands.updateAttributes("html", { content: newContent });
	};

	useEffect(() => {
		setStartContent(content);
		setContentEditState(content);
		setContentState(content);
	}, [content]);

	const save = () => {
		const newContent = contentEditState.length === 0 ? "<p>HTML</p>" : contentEditState;
		saveContent(newContent);
		setContentState(newContent);
		setStartContent(newContent);
		setContentEditState(newContent !== contentEditState ? newContent : contentEditState);
		setIsOpen(false);
	};

	const cancel = () => {
		setContentEditState(startContent);
		setContentState(startContent);
		setIsOpen(false);
	};

	return (
		<ModalLayout
			contentWidth="L"
			isOpen={isOpen}
			onClose={cancel}
			onOpen={() => setIsOpen(true)}
			trigger={<Button icon={"pencil"} tooltipText={t("edit2")} />}
			onCmdEnter={save}
		>
			<ModalLayoutLight>
				<FormStyle>
					<>
						<legend>{t("edit-html")}</legend>
						<FileInput
							language={"html"}
							value={contentState?.toString() ?? ""}
							onChange={setContentEditState}
						/>
						<div className="buttons">
							<ButtonAtom buttonStyle={ButtonStyle.underline} onClick={cancel}>
								<span>{t("cancel")}</span>
							</ButtonAtom>
							<ButtonAtom buttonStyle={ButtonStyle.default} onClick={save}>
								<span>{t("save")}</span>
							</ButtonAtom>
						</div>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

const HTMLMenu = ({ editor }: { editor: Editor }) => {
	const [node, setNode] = useState<Node>(null);
	const [position, setPosition] = useState<number>(null);

	useEffect(() => {
		const { node: focusNode, position: focusPosition } = getFocusNode(
			editor.state,
			(node) => node.type.name === "html",
		);
		if (focusNode) {
			setNode(focusNode);
		}
		if (typeof focusPosition === "number") setPosition(focusPosition);
	}, [editor.state.selection]);

	if (!editor.isActive("html")) return null;

	const handleDelete = () => {
		if (!node) return;
		editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
	};

	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				{node && <HTMLEditButton editor={editor} content={node.attrs?.content} />}
				<Button icon="trash" tooltipText={t("delete")} onClick={handleDelete} />
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default HTMLMenu;
