import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { useMediaQuery } from "@mui/material";
import { useCurrentEditor } from "@tiptap/react";
import { type CSSProperties, memo, type ReactNode, useCallback } from "react";

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
	const isMobile = useMediaQuery(cssMedia.JSnarrow);

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
			data-comment-block={commentId ? "true" : "false"}
			data-comment-id={commentId}
			onMouseEnter={isMobile ? undefined : onMouseEnter}
			onMouseLeave={isMobile ? undefined : onMouseLeave}
			style={style}
		>
			{children}
		</Wrapper>
	);
};

export default memo(BlockCommentView);
