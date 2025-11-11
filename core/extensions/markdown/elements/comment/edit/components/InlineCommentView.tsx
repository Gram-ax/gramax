import { CSSProperties, HTMLAttributes, ReactNode, useCallback } from "react";
import { useCurrentEditor } from "@tiptap/react";
import { classNames } from "@components/libs/classNames";
import getNearestNodeWithSameCommentId from "@ext/markdown/elements/comment/edit/logic/utils/getNearestNodeWithSameCommentId";

interface InlineCommentViewProps extends HTMLAttributes<HTMLSpanElement> {
	children: ReactNode;
	commentId?: string;
	style?: CSSProperties;
	className?: string;
}

const InlineCommentView = ({ children, commentId, style, className, ...props }: InlineCommentViewProps) => {
	const { editor } = useCurrentEditor();

	const onMouseEnter = useCallback(() => {
		if (!commentId || !editor) return;
		editor.commands.hoverComment(commentId);
	}, [commentId, editor]);

	const onMouseLeave = useCallback(() => {
		if (!editor) return;
		editor.commands.unhoverComment();
	}, [editor]);

	const onClick = useCallback(() => {
		if (!commentId || !editor) return;

		const range = getNearestNodeWithSameCommentId(editor.state, editor.state.selection.from, commentId);
		if (range) editor.commands.openComment(commentId, range);
	}, [commentId, editor]);

	return (
		<span
			className={classNames("inline-comment-view", {}, [className])}
			data-comment={commentId ? "true" : "false"}
			data-comment-id={commentId}
			data-comment-inline={commentId ? "true" : "false"}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			onClick={onClick}
			style={style}
			{...props}
		>
			{children}
		</span>
	);
};

export default InlineCommentView;
