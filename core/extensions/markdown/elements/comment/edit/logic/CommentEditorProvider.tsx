import CommentView from "@ext/markdown/elements/comment/edit/components/CommentView";
import { Editor, Range } from "@tiptap/core";
import { memo, useCallback } from "react";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { CommentBlock } from "@core-ui/CommentBlock";
import CommentBlockMark from "@ext/markdown/elements/comment/edit/logic/BlockMark";

interface CommentEditorProviderProps {
	editor: Editor;
	children: JSX.Element;
}

const CommentEditorProvider = (props: CommentEditorProviderProps): JSX.Element => {
	const { editor, children } = props;

	const apiUrlCreator = ApiUrlCreator.value;

	const loadComment = useCallback(
		async (id: string) => {
			const url = apiUrlCreator.getComment(id);
			const res = await FetchService.fetch<CommentBlock>(url);
			if (!res.ok) return;

			const comment = await res.json();
			return comment;
		},
		[apiUrlCreator],
	);

	const saveComment = useCallback(
		(id: string, comment: CommentBlock) => {
			const url = apiUrlCreator.updateComment(id);
			FetchService.fetch(url, JSON.stringify(comment));
		},
		[apiUrlCreator],
	);

	const deleteComment = useCallback(
		async (id: string, positions: Range[]) => {
			const data = await loadComment(id);
			if (data) {
				if (!editor.storage.comments) editor.storage.comments = [];
				editor.storage.comments.push({ id, comment: data });
			}

			const url = apiUrlCreator.deleteComment(id);
			await FetchService.fetch(url);

			const blockMark = new CommentBlockMark(editor.state.tr, editor.schema.marks.comment);
			const tr = blockMark.deleteMarkup(positions);
			editor.view.dispatch(tr);
		},
		[apiUrlCreator, editor, loadComment],
	);

	return (
		<>
			<CommentView
				commentId={editor.storage?.comment?.openedComment?.id}
				editor={editor}
				loadComment={loadComment}
				saveComment={saveComment}
				deleteComment={deleteComment}
			/>
			{children}
		</>
	);
};

export default memo(CommentEditorProvider);
