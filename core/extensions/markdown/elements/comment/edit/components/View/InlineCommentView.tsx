import { classNames } from "@components/libs/classNames";
import { cssMedia } from "@core-ui/utils/cssUtils";
import getNearestNodeWithSameCommentId from "@ext/markdown/elements/comment/edit/logic/utils/getNearestNodeWithSameCommentId";
import { useMediaQuery } from "@mui/material";
import { useCurrentEditor } from "@tiptap/react";
import { type CSSProperties, type HTMLAttributes, memo, type ReactNode, useCallback } from "react";

interface InlineCommentViewProps extends HTMLAttributes<HTMLSpanElement> {
	children: ReactNode;
	commentId?: string;
	style?: CSSProperties;
	className?: string;
}

const InlineCommentView = ({ children, commentId, style, className, ...props }: InlineCommentViewProps) => {
	const { editor } = useCurrentEditor();
	const isMobile = useMediaQuery(cssMedia.JSnarrow);

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
			onClick={onClick}
			onMouseEnter={isMobile ? undefined : onMouseEnter}
			onMouseLeave={isMobile ? undefined : onMouseLeave}
			style={style}
			{...props}
		>
			{children}
		</span>
	);
};

export default memo(InlineCommentView);
