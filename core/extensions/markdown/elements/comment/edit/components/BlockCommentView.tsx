import { CSSProperties, ReactNode, useCallback } from "react";
import { useCurrentEditor } from "@tiptap/react";
import styled from "@emotion/styled";
import { cn } from "@core-ui/utils/cn";

interface BlockCommentViewProps {
	children: ReactNode;
	commentId?: string;
	style?: CSSProperties;
	className?: string;
}

const Wrapper = styled.div`
	height: inherit;
	width: inherit;

	&:first-of-type {
		margin: 0 !important;
	}
`;

const BlockCommentView = ({ children, commentId, style, className }: BlockCommentViewProps) => {
	const { editor } = useCurrentEditor();

	const onMouseEnter = useCallback(() => {
		if (!commentId || !editor) return;
		editor.commands.hoverComment(commentId);
	}, [commentId, editor]);

	const onMouseLeave = useCallback(() => {
		if (!editor) return;
		editor.commands.unhoverComment();
	}, [editor]);

	return (
		<Wrapper
			className={cn("block-comment-view", className)}
			data-comment={commentId ? "true" : "false"}
			data-comment-id={commentId}
			data-comment-block={commentId ? "true" : "false"}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			style={style}
		>
			{children}
		</Wrapper>
	);
};

export default BlockCommentView;
