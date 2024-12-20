import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { getSimpleExtensions } from "@ext/markdown/core/edit/logic/getExtensions";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import { EditorContent, JSONContent, useEditor } from "@tiptap/react";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import EditorButtons from "./EditorButtons";

export type EditorProps = {
	confirmButtonText: string;
	onConfirm: (content: JSONContent[]) => void;
	onCancel: () => void;
	setFocusId?: Dispatch<SetStateAction<number>>;
	onEditorClick?: () => void;
	setParentIsActive?: Dispatch<SetStateAction<boolean>>;
	onInput?: (content: string) => void;
	placeholder?: string;
	content?: JSONContent[];
	isEditable?: boolean;
	className?: string;
};

const CommentEditor = styled(
	({
		confirmButtonText,
		onConfirm,
		onCancel,
		setFocusId,
		setParentIsActive,
		onEditorClick,
		onInput,
		placeholder,
		content = [{ type: "paragraph", content: [] }],
		isEditable = true,
		className,
	}: EditorProps) => {
		const [isFirstOpenFlag, setIsFirstOpenFlag] = useState(true);
		const [currentContent, setCurrentContent] = useState(content);
		const [isActive, setIsActive] = useState(false);

		const contentRef = useRef<HTMLDivElement>(null);

		useEffect(() => {
			if (JSON.stringify(currentContent) !== JSON.stringify(content)) setCurrentContent(content);
		}, [content]);

		const editor = useEditor(
			{
				content: { type: "doc", content },
				extensions: [...getSimpleExtensions(), placeholder ? Placeholder.configure({ placeholder }) : null],
				editable: isEditable,
			},
			[isEditable, currentContent],
		);

		useEffect(() => {
			if (onInput) onInput(editor?.getText());
		}, [editor?.getText()]);

		useEffect(() => {
			if (setParentIsActive) setParentIsActive(isActive);
		}, [isActive]);

		const blur = (): void => {
			editor.commands.blur();
		};

		useEffect(() => {
			if (!editor) return;
			const contentElement = getContentElement();
			if (isFirstOpenFlag && isEditable && contentElement) {
				setIsFirstOpenFlag(false);
				editor.commands.focus("start", { scrollIntoView: false });
			}

			setIsActive(isEditable);
		}, [editor, isFirstOpenFlag, isEditable]);

		useEffect(() => {
			if (!isEditable) setIsFirstOpenFlag(true);
		}, [isEditable]);

		useEffect(() => {
			const contentElement = getContentElement();
			if (contentElement && isFirstOpenFlag && isEditable) {
				contentElement.scrollTo({ top: contentElement.scrollHeight, behavior: "smooth" });
			}
		}, [contentRef.current?.firstChild]);

		const onCurrentConfirm = () => {
			if (!editor.isEmpty) onConfirm(editor.getJSON().content);
			if (!editor.isDestroyed) editor.commands.clearContent(true);
			if (setFocusId) setFocusId(null);
		};

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

		useEffect(() => {
			const contentElement = getContentElement();
			if (!contentElement) return;

			const keydownHandler = (e: KeyboardEvent) => {
				if (!isEditable || !isActive) return;

				if (e.code === "Escape") {
					e.stopImmediatePropagation();
					onCurrentCancel();
				} else if (e.code === "Enter" && (e.ctrlKey || e.metaKey)) {
					e.stopImmediatePropagation();
					onCurrentConfirm();
				}
			};

			contentElement.addEventListener("keydown", keydownHandler);
			return () => {
				contentElement.removeEventListener("keydown", keydownHandler);
			};
		});

		return (
			<div className={classNames("article", {}, [className])}>
				<EditorContent
					data-qa="editor"
					innerRef={contentRef}
					editor={editor}
					className={"article-body"}
					onClick={onCurrentEditorClick}
				/>
				{isActive ? (
					<EditorButtons
						onCancel={onCurrentCancel}
						onConfirm={onCurrentConfirm}
						confirmDisabled={editor.isEmpty && isEditable}
						confirmButtonText={confirmButtonText}
					/>
				) : null}
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
