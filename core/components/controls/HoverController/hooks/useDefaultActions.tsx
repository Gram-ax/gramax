import ActionButton from "@components/controls/HoverController/ActionButton";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import t from "@ext/localization/locale/translate";
import { useNodeViewContext } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import { NodeSelection } from "@tiptap/pm/state";
import { ReactNode, useCallback, useMemo } from "react";

export interface UseDefaultActionsOptions {
	comment?: boolean;
	delete?: boolean;
}

const useDefaultActions = (right: ReactNode, left: ReactNode, options: UseDefaultActionsOptions = {}) => {
	const { editor, deleteNode } = useNodeViewContext();
	const apiUrlCreator = ApiUrlCreator.value;
	const { comment = false, delete: deleteAction = true } = options;

	const handleDelete = useCallback(() => {
		deleteNode();
	}, [deleteNode]);

	const handleAddComment = useCallback(async () => {
		if (!editor || !(editor.state.selection instanceof NodeSelection)) return;
		const $pos = editor.state.selection.$anchor;
		const node = editor.state.selection.node;

		const commentId = node.attrs.comment?.id;
		if (commentId) {
			editor.commands.openComment(commentId, { from: $pos.pos, to: $pos.pos + node.nodeSize });
			return;
		}

		const res = await FetchService.fetch(apiUrlCreator.getNewCommentId());
		if (!res.ok) return;

		editor.commands.toggleComment({ id: await res.text() }, { from: $pos.pos, to: $pos.pos + node.nodeSize });
	}, [editor, apiUrlCreator]);

	const memoRight = useMemo(
		() => (
			<>
				{right}
				{comment && (
					<ActionButton icon="message-square" tooltipText={t("leave-comment")} onClick={handleAddComment} />
				)}
				{deleteAction && <ActionButton icon="trash" onClick={handleDelete} tooltipText={t("delete")} />}
			</>
		),
		[right, handleAddComment, handleDelete, comment, deleteAction],
	);

	if (!editor.isEditable) return {};
	return {
		Left: left,
		Right: memoRight,
	};
};

export default useDefaultActions;
