import { MinimizedArticleStyled } from "@components/Article/MiniArticle";
import { cn } from "@core-ui/utils/cn";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { getSimpleExtensions } from "@ext/markdown/core/edit/logic/getExtensions";
import { CommentFooter } from "@ext/markdown/elements/comment/edit/components/Popover/CommentFooter";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import { type FocusPosition, isNodeEmpty, type JSONContent } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import type { EditorView } from "@tiptap/pm/view";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { memo, useCallback } from "react";

export interface CommentInputProps {
	content?: JSONContent[];
	autofocus?: FocusPosition;
	editable?: boolean;
	isNewComment?: boolean;
	onConfirm: (content: JSONContent[]) => void;
	onCancel?: () => void;
}

const StyledEditorContent = styled(EditorContent)`
	flex: 1 1 auto;
	min-width: 0;
	max-width: 100%;
	word-break: break-word;
	cursor: text;

	&[data-state="new"] {
		overflow-y: auto;
		max-height: min(25vh, 15rem);
	}

	> div {
		flex-grow: 1;
	}

	&:has(> div > *:nth-last-of-type(2)) {
		width: 100%;
	}

	p:last-of-type {
		margin-bottom: 0 !important;
	}
`;

export const CommentInput = memo((props: CommentInputProps) => {
	const {
		content = [{ type: "paragraph", content: [] }],
		autofocus = false,
		editable,
		onConfirm,
		onCancel,
		isNewComment = true,
	} = props;

	const onKeyDown = useCallback(
		(view: EditorView, event: KeyboardEvent) => {
			if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
				if (isNodeEmpty(view.state.doc) || !view.hasFocus()) return;

				event.preventDefault();
				onConfirm(view.state.doc.toJSON().content);
			}
		},
		[onConfirm],
	);

	const editor = useEditor(
		{
			content: { type: "doc", content },
			extensions: [
				...getSimpleExtensions(),
				Comment,
				Document,
				Placeholder.configure({
					placeholder: ({ editor, node }) => {
						const isFirstParagraph =
							editor.state.doc.firstChild.type.name === "paragraph" &&
							editor.state.doc.firstChild === node;

						if (isFirstParagraph) return t("leave-comment");
					},
				}),
			],
			editorProps: {
				handleKeyDown: onKeyDown,
			},
			autofocus: autofocus,
			editable: editable,
		},
		[editable],
	);

	return (
		<MinimizedArticleStyled>
			<EditorContext.Provider value={{ editor }}>
				<div
					className={cn("flex items-center gap-2 w-full", !isNewComment && "flex-wrap")}
					style={{ minHeight: "1.5rem" }}
				>
					<StyledEditorContent
						className={cn(
							"flex text-sm rounded-sm focus:border-secondary-border",
							!isNewComment && "w-full",
						)}
						data-editable={editable}
						data-qa="editor"
						data-state={isNewComment ? "new" : "old"}
						editor={editor}
					/>
					<CommentFooter
						editable={editable}
						editor={editor}
						isNewComment={isNewComment}
						onCancel={onCancel}
						onConfirm={onConfirm}
					/>
				</div>
			</EditorContext.Provider>
		</MinimizedArticleStyled>
	);
});
