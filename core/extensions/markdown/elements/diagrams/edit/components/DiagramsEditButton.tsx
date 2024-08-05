import ButtonAtom from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import FileInput from "@components/Atoms/FileInput/FileInput";
import Input from "@components/Atoms/Input";
import FormStyle from "@components/Form/FormStyle";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import OnLoadResourceService from "@ext/markdown/elements/copyArticles/onLoadResourceService";
import { Editor } from "@tiptap/core";
import { Node } from "prosemirror-model";
import { ChangeEvent, useEffect, useState } from "react";
import DiagramType from "../../../../../../logic/components/Diagram/DiagramType";
import ApiUrlCreator from "../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import getFocusNode from "../../../../elementsUtils/getFocusNode";

const langs: { [type in DiagramType]: string } = {
	Mermaid: "mermaid",
	"Ts-diagram": "typescript",
	"C4-diagram": "c4-model",
	"Plant-uml": "plant-uml",
};

const DiagramsEditButton = ({
	src,
	content,
	diagramName,
	editor,
}: {
	src?: string;
	content?: string;
	diagramName: DiagramType;
	editor: Editor;
}) => {
	const [isOpen, setIsOpen] = useState(false);
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
		setIsOpen(false);
	};

	const cancel = () => {
		setContentEditState(startContent);
		setContentState(startContent);
		setIsOpen(false);
	};

	const loadContent = async (src: string, apiUrlCreator: ApiUrlCreator) => {
		const res = await FetchService.fetch<string>(apiUrlCreator.getArticleResource(src));
		if (!res.ok) return;
		const content = await res.text();
		setContentState(content);
		setStartContent(content);
		setContentEditState(content);
	};

	useEffect(() => {
		if (!src) return;
		loadContent(src, apiUrlCreator);
	}, [src, apiUrlCreator]);

	useEffect(() => {
		if (content) setContentState(content);
	}, [content]);

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
						<legend>{`${t("diagram.name")} ${diagramName}`}</legend>
						<FileInput
							language={langs[diagramName]}
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

	return (
		<ModalLayoutDark>
			<ButtonsLayout>
				<Input placeholder={t("signature")} value={title} onChange={handleTitleChange} />
				<div className="divider" />
				{node && (
					<DiagramsEditButton
						editor={editor}
						src={node.attrs?.src}
						content={node.attrs?.content}
						diagramName={node.attrs?.diagramName}
					/>
				)}
				<Button icon="trash" tooltipText={t("delete")} onClick={handleDelete} />
			</ButtonsLayout>
		</ModalLayoutDark>
	);
};

export default DiagramsMenu;
