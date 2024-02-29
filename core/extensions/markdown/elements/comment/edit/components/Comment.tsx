import styled from "@emotion/styled";
import { JSONContent } from "@tiptap/core";
import { Mark } from "prosemirror-model";
import { useEffect } from "react";
import CommentBlockComponent from "../../../../../../components/Comments/CommentBlock";
import Input from "../../../../../../components/Comments/Input";
import { CommentBlock } from "../../../../../../ui-logic/CommentBlock";
import useLocalize from "../../../../../localization/useLocalize";

const Comment = styled(
	({
		mark,
		element,
		onDelete,
		onUpdate,
		onCreateComment,
		className,
	}: {
		mark: Mark;
		element: HTMLElement;
		onDelete: () => void;
		onUpdate: (commentBlock: CommentBlock) => void;
		onCreateComment: (content: JSONContent[]) => void;
		className?: string;
	}) => {
		useEffect(() => {
			element.style.color = "var(--color-comment-active-text)";
			element.style.background = "var(--color-comment-active-bg)";
			return () => {
				element.style.color = "var(--color-article-text)";
				element.style.background = "var(--color-comment-bg)";
			};
		}, [mark?.attrs?.count]);

		return (
			<div className={className}>
				{mark.attrs?.comment ? (
					<CommentBlockComponent
						maxHeight="50vh"
						commentBlock={mark.attrs as any}
						onUpdate={onUpdate}
						onDeleteComment={onDelete}
					/>
				) : (
					<div className="add-input" data-qa="qa-add-comment">
						<Input
							onCancel={onDelete}
							onConfirm={onCreateComment}
							placeholder={useLocalize("leaveAComment")}
							confirmButtonText={useLocalize("comment")}
							onCreate={({ editor }) => editor.commands.focus()}
						/>
					</div>
				)}
			</div>
		);
	},
)`
	z-index: 1;
	border-radius: 4px;
	background: var(--color-comments-bg);
	box-shadow: var(--comment-tooltip-shadow);

	.add-input {
		width: 500px;
		padding: 1rem 0 1rem 1rem;
	}
`;

export default Comment;
