import Button from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import FileInput from "@components/Atoms/FileInput/FileInput";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import DiagramType from "@core/components/Diagram/DiagramType";
import t from "@ext/localization/locale/translate";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import { Editor } from "@tiptap/core";
import { useEffect, useState } from "react";

const langs: { [type in DiagramType]: string } = {
	Mermaid: "mermaid",
	"Ts-diagram": "typescript",
	"C4-diagram": "c4-model",
	"Plant-uml": "plant-uml",
};

interface DiagramsEditorProps {
	editor: Editor;
	diagramName: DiagramType;
	src?: string;
	content?: string;
	trigger?: JSX.Element;
	onClose?: () => void;
}

const DiagramsEditor = (props: DiagramsEditorProps) => {
	const { src, content, diagramName, editor, trigger, onClose } = props;
	const [isOpen, setIsOpen] = useState(trigger ? false : true);
	const [startContent, setStartContent] = useState(content ?? "");
	const [contentState, setContentState] = useState(content ?? "");
	const [contentEditState, setContentEditState] = useState(content ?? "");
	const apiUrlCreator = ApiUrlCreatorService.value;

	const saveSrc = (newContent: string) => {
		if (!src) return;
		FetchService.fetch(apiUrlCreator.setArticleResource(src), newContent);
		OnLoadResourceService.update(src, Buffer.from(newContent));
	};

	const saveContent = (newContent: string) => {
		if (!content) return;
		editor.commands.updateAttributes("diagrams", { content: newContent });
	};

	const save = () => {
		if (src) saveSrc(contentEditState);
		else saveContent(contentEditState);
		setContentState(contentEditState);
		setStartContent(contentEditState);
		onClose?.();
		setIsOpen(false);
	};

	const cancel = () => {
		setContentEditState(startContent);
		setContentState(startContent);
		onClose?.();
		setIsOpen(false);
	};

	const loadContent = (src: string) => {
		if (!src) return;
		const cnt = OnLoadResourceService.getBuffer(src).toString();
		setContentState(cnt);
		setStartContent(cnt);
		setContentEditState(cnt);
	};

	useEffect(() => {
		if (content) setContentState(content);
	}, [content]);

	useEffect(() => {
		loadContent(src);
	}, [src]);

	return (
		<ModalLayout
			contentWidth="L"
			isOpen={isOpen}
			onClose={cancel}
			onOpen={() => {
				setIsOpen(true);
			}}
			trigger={trigger}
			onCmdEnter={save}
		>
			<ModalLayoutLight>
				<FormStyle>
					<>
						<legend>{`${t("diagram.name")} ${diagramName}`}</legend>
						<FileInput
							language={langs[diagramName]}
							value={contentState?.toString() ?? ""}
							onChange={setContentEditState}
						/>
						<div className="buttons">
							<Button buttonStyle={ButtonStyle.underline} onClick={cancel}>
								<span>{t("cancel")}</span>
							</Button>
							<Button buttonStyle={ButtonStyle.default} onClick={save}>
								<span>{t("save")}</span>
							</Button>
						</div>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default DiagramsEditor;
