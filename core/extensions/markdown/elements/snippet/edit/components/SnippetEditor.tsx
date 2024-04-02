import ButtonAtom from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Field from "@components/Form/Field";
import Form from "@components/Form/Form";
import FormStyle from "@components/Form/FormStyle";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { getEnglishStr } from "@core-ui/languageConverter/getEnglishStr";
import FormVariableHandler from "@core/Form/FormVariableHandler";
import validateEncodingSymbolsUrl from "@core/utils/validateEncodingSymbolsUrl";
import useLocalize from "@ext/localization/useLocalize";
import { getSimpleExtensions } from "@ext/markdown/core/edit/logic/getExtensions";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import SnippetEditorProps from "@ext/markdown/elements/snippet/edit/model/SnippetEditorProps.schema";
import SnippetEditorPropsSchema from "@ext/markdown/elements/snippet/edit/model/SnippetEditorProps.schema.json";
import SnippetEditData from "@ext/markdown/elements/snippet/model/SnippetEditData";
import { EditorContent, useEditor } from "@tiptap/react";
import { JSONSchema7 } from "json-schema";
import { useEffect, useState } from "react";

const emptyContent = { type: "doc", content: [[{ type: "text", text: "" }]] };

const SnippetEditor = ({
	snippetData = { content: emptyContent, id: undefined, title: undefined },
	type,
	onOpen,
	onSave,
	onClose,
	onDelete,
}: {
	snippetData?: SnippetEditData;
	type: "create" | "edit";
	onOpen?: VoidFunction;
	onClose?: VoidFunction;
	onDelete?: () => Promise<void> | void;
	onSave?: (data: SnippetEditData) => Promise<void> | void;
}) => {
	const [isOpen, setIsOpen] = useState(true);
	const [currentProps, setCurrentProps] = useState<SnippetEditorProps>({
		id: snippetData.id,
		title: snippetData.title,
	});
	const [schema] = useState<JSONSchema7>({ ...SnippetEditorPropsSchema } as JSONSchema7);
	const noEncodingSymbolsInUrlText = useLocalize("noEncodingSymbolsInUrl");
	const enterSnippetText = useLocalize("enterSnippetText");

	const editor = useEditor(
		{
			content: snippetData.content,
			extensions: [...getSimpleExtensions(), Placeholder.configure({ placeholder: enterSnippetText })],
		},
		[],
	);
	useEffect(() => {
		if (!editor || !currentProps.id || !currentProps.title) return;
		editor.commands.focus(editor.state.doc.nodeSize);
	}, [editor]);

	const currentOnSave = () => {
		setIsOpen(false);
		onSave({ content: editor.getJSON(), id: currentProps.id, title: currentProps.title });
	};

	const validate = () => {
		return (
			currentProps.id &&
			currentProps.title &&
			validateEncodingSymbolsUrl(currentProps.id) &&
			editor &&
			!editor.isEmpty
		);
	};

	return (
		<Modal
			onCmdEnter={() => {
				if (validate()) currentOnSave();
			}}
			isOpen={isOpen}
			contentWidth="M"
			onOpen={() => {
				setIsOpen(true);
				onOpen?.();
			}}
			onClose={() => {
				setIsOpen(false);
				onClose?.();
			}}
		>
			<ModalLayoutLight>
				<FormStyle formDirection="row">
					<>
						<Form<SnippetEditorProps>
							schema={schema}
							initStyles={false}
							props={currentProps}
							validate={(a) => ({
								id: validateEncodingSymbolsUrl(a.id) ? null : noEncodingSymbolsInUrlText,
							})}
							onMount={() => {
								new FormVariableHandler(schema, {
									TYPE: type === "edit" ? "Редактирование" : "Создание",
								}).replaceVars();
								(schema.properties.id as any).readOnly = type === "edit";
							}}
							onChange={(props) => {
								if (type === "edit") return setCurrentProps(props);

								const getScreeningEngStr = (str: string) =>
									getEnglishStr(str.toLocaleLowerCase())
										.replaceAll(/[^\w\-_]/g, "-")
										.replaceAll("--", "-")
										.replaceAll("--", "-")
										.replaceAll("--", "-");

								const oldTitle = currentProps.title ?? "";
								const engStr = getScreeningEngStr(oldTitle);

								if ((!props.id && !oldTitle) || props.id == engStr) {
									props.id = getScreeningEngStr(props.title);
								}

								setCurrentProps(props);
							}}
						/>
						<fieldset>
							<Field
								required
								fieldDirection="column"
								scheme={{ title: "<p>Контент сниппета</p>" }}
								input={
									<div className="article">
										<div className="article-content">
											<EditorContent editor={editor} tabIndex={3} />
										</div>
									</div>
								}
							/>
						</fieldset>
						<div className="buttons">
							{onDelete && (
								<div className="left-buttons">
									<ButtonAtom buttonStyle={ButtonStyle.underline} onClick={onDelete}>
										<span>{useLocalize("delete")}</span>
									</ButtonAtom>
								</div>
							)}
							<ButtonAtom
								buttonStyle={ButtonStyle.underline}
								onClick={() => {
									setIsOpen(false);
								}}
							>
								<span>{useLocalize("cancel")}</span>
							</ButtonAtom>
							<ButtonAtom
								buttonStyle={ButtonStyle.default}
								onClick={currentOnSave}
								disabled={!validate()}
							>
								<span>{useLocalize("save")}</span>
							</ButtonAtom>
						</div>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</Modal>
	);
};

export default SnippetEditor;
