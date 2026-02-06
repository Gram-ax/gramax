import ActionButton from "@components/controls/HoverController/ActionButton";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
import { useNodeViewContext } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import FloatActions from "@ext/markdown/elements/float/edit/components/FloatActions";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { NodeSelection } from "@tiptap/pm/state";
import { ReactNode, useCallback, useMemo } from "react";

export interface UseDefaultActionsOptions {
	// Button for adding a comment to the node. Need to add node type in Comment extension.
	comment?: boolean;
	// Default delete button.
	delete?: boolean;
	// Button for adding alignment to the node. Need to specify the node type in Float extension.
	float?: boolean;
}

const useDefaultActions = (right: ReactNode, left: ReactNode, options: UseDefaultActionsOptions = {}) => {
	const { editor, deleteNode, node, getPos } = useNodeViewContext();
	const apiUrlCreator = ApiUrlCreator.value;
	const pageDataContext = PageDataContext.value;
	const disabledComment = !pageDataContext.userInfo || !EditorService.getData("commentEnabled");
	const { comment = false, delete: deleteAction = true, float = false } = options;
	const hasComment = Boolean(node?.attrs?.comment?.id);

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
				{float && <FloatActions editor={editor} getPos={getPos} node={node} />}
				{right}
				{comment && !disabledComment && (
					<ActionButton
						icon={hasComment ? "message-square-text" : "message-square"}
						onClick={handleAddComment}
						tooltipText={hasComment ? t("show-comment") : t("leave-comment")}
					/>
				)}
				{deleteAction && <ActionButton icon="trash" onClick={handleDelete} tooltipText={t("delete")} />}
			</>
		),
		[right, handleAddComment, handleDelete, comment, deleteAction, disabledComment, hasComment],
	);

	if (!editor.isEditable) return {};
	return {
		Left: left,
		Right: memoRight,
	};
};

export default useDefaultActions;
