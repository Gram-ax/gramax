import FetchService from "@core-ui/ApiServices/FetchService";
import { CommentBlock } from "@core-ui/CommentBlock";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import CommentView from "@ext/markdown/elements/comment/edit/components/CommentView";
import CommentBlockMark from "@ext/markdown/elements/comment/edit/logic/BlockMark";
import { Editor, Range } from "@tiptap/core";
import { memo, useCallback } from "react";

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
		(id: string, positions: Range[]) => {
			const blockMark = new CommentBlockMark(editor.state.tr, editor.schema.marks.comment);
			const tr = blockMark.deleteMarkup(positions);
			editor.view.dispatch(tr);
		},
		[editor],
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
