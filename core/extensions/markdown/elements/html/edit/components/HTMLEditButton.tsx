import ButtonAtom from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import FileInput from "@components/Atoms/FileInput/FileInput";
import ActionButton from "@components/controls/HoverController/ActionButton";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import t from "@ext/localization/locale/translate";
import { Editor } from "@tiptap/core";
import { useEffect, useState } from "react";

const HTMLEditor = ({ content, editor, onClose }: { content?: string; editor: Editor; onClose: () => void }) => {
	const [isOpen, setIsOpen] = useState(true);
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
		onClose();
	};

	const cancel = () => {
		setContentEditState(startContent);
		setContentState(startContent);
		setIsOpen(false);
		onClose();
	};

	return (
		<ModalLayout
			contentWidth="L"
			isOpen={isOpen}
			onClose={cancel}
			trigger={<ActionButton icon={"pencil"} tooltipText={t("edit2")} />}
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

export default HTMLEditor;
