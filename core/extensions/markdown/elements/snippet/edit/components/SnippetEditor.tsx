import ButtonAtom from "@components/Atoms/Button/Button";
import { ButtonStyle } from "@components/Atoms/Button/ButtonStyle";
import Field from "@components/Form/Field";
import Form from "@components/Form/Form";
import FormStyle from "@components/Form/FormStyle";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { transliterate } from "@core-ui/languageConverter/transliterate";
import validateEncodingSymbolsUrl from "@core/utils/validateEncodingSymbolsUrl";
import t from "@ext/localization/locale/translate";
import { getSimpleExtensions } from "@ext/markdown/core/edit/logic/getExtensions";
import simpleLink from "@ext/markdown/elements/link/edit/model/simpleLink";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import SnippetViewUses from "@ext/markdown/elements/snippet/edit/components/SnippetViewUses";
import SnippetEditorProps from "@ext/markdown/elements/snippet/edit/model/SnippetEditorProps.schema";
import SnippetEditorPropsSchema from "@ext/markdown/elements/snippet/edit/model/SnippetEditorProps.schema.json";
import SnippetEditData from "@ext/markdown/elements/snippet/model/SnippetEditData";
import { EditorContent, useEditor } from "@tiptap/react";
import { JSONSchema7 } from "json-schema";
import { useEffect, useState } from "react";

const emptyContent = { type: "doc", content: [[{ type: "text", text: "" }]] };

const SnippetEditor = ({
	snippetData = { content: emptyContent, id: undefined, title: undefined },
	snippetsListIds,
	type,
	articles,
	onOpen,
	onSave,
	onClose,
	onDelete,
}: {
	type: "create" | "edit";
	snippetsListIds: string[];
	snippetData?: SnippetEditData;
	articles?: { pathname: string; title: string }[];
	onOpen?: () => void | Promise<void>;
	onClose?: () => void | Promise<void>;
	onDelete?: () => Promise<void> | void;
	onSave?: (data: SnippetEditData) => Promise<void> | void;
}) => {
	const [isOpen, setIsOpen] = useState(true);
	const [currentProps, setCurrentProps] = useState<SnippetEditorProps>({
		id: snippetData.id,
		title: snippetData.title,
	});
	const [schema] = useState<JSONSchema7>({ ...SnippetEditorPropsSchema } as JSONSchema7);
	const noEncodingSymbolsInUrlText = t("no-encoding-symbols-in-url");
	const snippetAlreadyExistsText = t("snippet-already-exists");
	const enterSnippetText = t("enter-snippet-text");

	const editor = useEditor(
		{
			content: snippetData.content,
			extensions: [
				...getSimpleExtensions(),
				Placeholder.configure({ placeholder: enterSnippetText }),
				simpleLink,
			],
		},
		[],
	);

	useEffect(() => void onOpen?.(), []);

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
							validate={(a) => {
								let idValidationText: string = null;
								if (!validateEncodingSymbolsUrl(a.id)) idValidationText = noEncodingSymbolsInUrlText;
								if (snippetsListIds.filter((s) => s !== snippetData.id).includes(a.id))
									idValidationText = snippetAlreadyExistsText;
								return { id: idValidationText };
							}}
							onMount={(_, schema) => {
								(schema as any).see = type === "edit" ? "snippet-editor" : "snippet-add";
								(schema.properties.id as any).readOnly = type === "edit";
							}}
							onChange={(props) => {
								if (type === "edit") return setCurrentProps(props);

								const oldTitle = currentProps.title ?? "";
								const engStr = transliterate(oldTitle, { kebab: true });

								if ((!props.id && !oldTitle) || props.id == engStr) {
									props.id = transliterate(props.title, { kebab: true });
								}

								setCurrentProps(props);
							}}
						/>
						<fieldset>
							<Field
								required
								formTranslationKey={"snippet-editor"}
								translationKey={"content"}
								fieldDirection="column"
								scheme={{ title: null }}
								input={
									<>
										<div
											className="article"
											style={{
												border: "1px solid var(--color-line)",
												borderRadius: "var(--radius-small)",
												padding: "6px 12px",
											}}
										>
											<div className="article-content">
												<EditorContent editor={editor} tabIndex={3} data-qa="editor" />
											</div>
										</div>
										{articles && (
											<div
												style={{ marginBottom: "-0.7em", marginTop: "1rem", fontSize: "1rem" }}
											>
												<SnippetViewUses
													articles={articles}
													onLinkClick={() => setIsOpen(false)}
												/>
											</div>
										)}
									</>
								}
							/>
						</fieldset>
						<div className="buttons">
							{onDelete && (
								<div className="left-buttons">
									<ButtonAtom
										buttonStyle={ButtonStyle.underline}
										onClick={onDelete}
										style={{ marginLeft: "0" }}
									>
										<span>{t("delete")}</span>
									</ButtonAtom>
								</div>
							)}
							<ButtonAtom
								buttonStyle={ButtonStyle.underline}
								onClick={() => {
									setIsOpen(false);
								}}
							>
								<span>{t("cancel")}</span>
							</ButtonAtom>
							<ButtonAtom
								buttonStyle={ButtonStyle.default}
								onClick={currentOnSave}
								disabled={!validate()}
							>
								<span>{t("save")}</span>
							</ButtonAtom>
						</div>
					</>
				</FormStyle>
			</ModalLayoutLight>
		</Modal>
	);
};

export default SnippetEditor;
