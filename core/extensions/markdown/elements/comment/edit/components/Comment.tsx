import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { JSONContent } from "@tiptap/core";
import { memo } from "react";
import CommentBlockComponent from "../../../../../../components/Comments/CommentBlock";
import Input from "../../../../../../components/Comments/Input";
import { CommentBlock } from "../../../../../../ui-logic/CommentBlock";
import { EditorView } from "prosemirror-view";

interface CommentProps {
	mark: CommentBlock;
	view: EditorView;
	onDelete: () => void;
	onCreate: (commentBlock: CommentBlock) => void;
	onConfirm: (content: JSONContent[]) => void;
	onAddAnswer: (commentBlock: CommentBlock) => void;
	className?: string;
}

const Wrapper = styled.div`
	z-index: var(--z-index-popover);
	font-size: 14px;
	width: 30em;
	word-break: break-all;
`;

const Comment = (props: CommentProps) => {
	const { mark, onDelete, onCreate, onConfirm, onAddAnswer, className } = props;

	if (mark?.comment) {
		if (!Array.isArray(mark.answers)) mark.answers = [];
		return (
			<Wrapper className={className}>
				<CommentBlockComponent
					maxHeight="50vh"
					commentBlock={mark}
					onUpdate={onCreate}
					onDeleteComment={onDelete}
					onAddAnswer={onAddAnswer}
				/>
			</Wrapper>
		);
	}

	return (
		<Wrapper className={className}>
			<div className="add-input" data-qa="qa-add-comment">
				<Input
					autoFocus
					onCancel={onDelete}
					onConfirm={onConfirm}
					placeholder={t("leave-comment")}
					confirmButtonText={t("comment-on")}
				/>
			</div>
		</Wrapper>
	);
};

export default styled(memo(Comment))`
	z-index: var(--z-index-foreground);
	border-radius: var(--radius-x-large);
	overflow: hidden;
	background: var(--color-comments-bg);
	box-shadow: var(--comment-tooltip-shadow);

	.add-input {
		padding: 1em;
	}
`;
