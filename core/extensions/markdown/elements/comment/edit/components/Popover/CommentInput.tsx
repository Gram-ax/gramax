import { MinimizedArticleStyled } from "@components/Article/MiniArticle";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { cn } from "@core-ui/utils/cn";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { getSimpleExtensions } from "@ext/markdown/core/edit/logic/getExtensions";
import type { InlineToolbarButtons } from "@ext/markdown/elements/article/edit/helpers/InlineEditPanel";
import { InlineToolbar } from "@ext/markdown/elements/article/edit/helpers/InlineToolbar";
import { CommentFooter } from "@ext/markdown/elements/comment/edit/components/Popover/CommentFooter";
import Comment from "@ext/markdown/elements/comment/edit/model/comment";
import { InlineLinkMenu } from "@ext/markdown/elements/link/edit/components/LinkMenu/InlineLinkMenu";
import Link from "@ext/markdown/elements/link/edit/model/link";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import { type Editor, type FocusPosition, isNodeEmpty, type JSONContent } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import type { EditorView } from "@tiptap/pm/view";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { memo, type RefObject, useCallback } from "react";

export interface CommentInputProps {
	content?: JSONContent[];
	autofocus?: FocusPosition;
	editable?: boolean;
	isNewComment?: boolean;
	containerRef?: RefObject<HTMLDivElement>;
	onConfirm: (content: JSONContent[]) => void;
	onCancel?: () => void;
}

const StyledEditorContent = styled(EditorContent)`
	flex: 1 1 auto;
	min-width: 0;
	max-width: 100%;
	word-break: break-word;

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

const inlineToolbarButtons: InlineToolbarButtons = {
	tableGroup: {
		mergeCells: false,
		splitCells: false,
		deleteRow: false,
		deleteColumn: false,
		aggregation: false,
	},
	inlineGroup: {
		file: false,
		comment: false,
		prettify: false,
	},
};

export const CommentInput = memo((props: CommentInputProps) => {
	const {
		content = [{ type: "paragraph", content: [] }],
		autofocus = false,
		editable,
		onConfirm,
		onCancel,
		isNewComment = true,
		containerRef,
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
				Link,
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
				attributes: {
					"data-testid": "comment-editor",
				},
			},
			autofocus: autofocus,
			editable: editable,
		},
		[editable],
	);

	const shouldShow = useCallback(({ editor }: { editor: Editor }) => {
		if (!editor.isEditable) return false;

		const { from, to, empty } = editor.state.selection;
		if (empty) return false;

		const text = !!editor.state.doc.textBetween(from, to);
		if (!text) return false;

		return true;
	}, []);

	return (
		<MinimizedArticleStyled>
			<ButtonStateService.Provider editor={editor}>
				<EditorContext.Provider value={{ editor }}>
					<div
						className={cn("flex items-center gap-2 w-full", !isNewComment && "flex-wrap")}
						style={{ minHeight: "1.5rem" }}
					>
						<InlineToolbar
							boundaryRef={containerRef}
							buttons={inlineToolbarButtons}
							editor={editor}
							pluginKey="comment-inline-toolbar"
							shouldShow={shouldShow}
						/>
						<InlineLinkMenu
							boundaryRef={containerRef}
							editor={editor}
							fallbackPlacements={["top", "bottom", "top-start", "bottom-start", "top-end", "bottom-end"]}
							placement="top"
						/>
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
			</ButtonStateService.Provider>
		</MinimizedArticleStyled>
	);
});
