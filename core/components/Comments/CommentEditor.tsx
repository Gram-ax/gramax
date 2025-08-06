import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import getExtensions from "@ext/markdown/core/edit/logic/getExtensions";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import Document from "@tiptap/extension-document";
import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import EditorButtons from "./EditorButtons";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
import useWatch from "@core-ui/hooks/useWatch";

export type EditorProps = {
	confirmButtonText: string;
	autoFocus?: boolean;
	onConfirm: (content: JSONContent[]) => void;
	onCancel: () => void;
	onEditorClick?: () => void;
	onInput?: (content: string) => void;
	setParentIsActive?: Dispatch<SetStateAction<boolean>>;
	setFocusId?: Dispatch<SetStateAction<number>>;
	placeholder?: string;
	content?: JSONContent[];
	isEditable?: boolean;
	parentIsActive?: boolean;
	className?: string;
};

const CommentEditor = styled(
	({
		confirmButtonText,
		autoFocus = false,
		onConfirm,
		onCancel,
		setFocusId,
		setParentIsActive,
		onEditorClick,
		onInput,
		placeholder,
		content = [{ type: "paragraph", content: [] }],
		isEditable = true,
		parentIsActive,
		className,
	}: EditorProps) => {
		const [currentContent, setCurrentContent] = useState(content);
		const [isActive, setIsActive] = useState(false);

		const contentRef = useRef<HTMLDivElement>(null);

		useEffect(() => {
			if (JSON.stringify(currentContent) !== JSON.stringify(content)) setCurrentContent(content);
		}, [content]);

		useWatch(() => {
			setIsActive(parentIsActive);
		}, [parentIsActive]);

		const onFocus = () => {
			setIsActive(true);
			if (setParentIsActive) setParentIsActive(true);
		};

		const onBlur = () => {
			if (editor.isEmpty) setIsActive(false);
		};

		const editor = useEditor(
			{
				content: { type: "doc", content },
				extensions: [
					...getExtensions(),
					Comment,
					Document,
					placeholder ? Placeholder.configure({ placeholder }) : null,
				],
				onFocus,
				onBlur,
				autofocus: autoFocus,
				editable: isEditable,
			},
			[isEditable, currentContent],
		);

		useEffect(() => {
			if (onInput) onInput(editor?.getText());
		}, [editor?.getText()]);

		const blur = (): void => {
			editor.commands.blur();
		};

		useEffect(() => {
			const contentElement = getContentElement();
			if (contentElement && isEditable) {
				contentElement.scrollTo({ top: contentElement.scrollHeight, behavior: "smooth" });
			}
		}, []);

		const onCurrentConfirm = () => {
			if (!editor.isEmpty) onConfirm(editor.getJSON().content);
			if (!editor.isDestroyed) editor.commands.clearContent(true);
			if (setFocusId) setFocusId(null);
		};

		useEffect(() => {
			const onKeyDown = (event: KeyboardEvent) => {
				if (editor.isFocused && event.code === "Enter" && (event.ctrlKey || event.metaKey)) {
					event.stopImmediatePropagation();
					onCurrentConfirm();
					return true;
				}
			};

			window.addEventListener("keydown", onKeyDown, { capture: true });
			return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
		}, [editor]);

		const onCurrentCancel = () => {
			blur();
			editor.commands.clearContent(true);
			onCancel();
			if (setFocusId) setFocusId(null);
		};

		const onCurrentEditorClick = () => {
			if (onEditorClick) onEditorClick();
		};

		const getContentElement = (): HTMLDivElement => {
			return contentRef.current?.firstChild as HTMLDivElement;
		};

		return (
			<div className={classNames("article", {}, [className])}>
				<EditorContent
					data-qa="editor"
					innerRef={contentRef}
					editor={editor}
					className={"article-body"}
					onClick={onCurrentEditorClick}
				/>
				<EditorButtons
					onCancel={onCurrentCancel}
					onConfirm={onCurrentConfirm}
					confirmDisabled={!isActive || (editor.isEmpty && isEditable)}
					confirmButtonText={confirmButtonText}
				/>
			</div>
		);
	},
)`
	flex: 1;
	width: 100%;
	color: var(--color-article-text);
	background: none;

	.ProseMirror {
		${(p) => (p.isEditable === false ? "" : `max-height: 7em;	overflow-y: auto;`)}
	}

	.ProseMirror.is-editor-empty {
		margin: 0;
	}
`;

export default CommentEditor;
