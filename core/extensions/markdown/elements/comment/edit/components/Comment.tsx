import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { JSONContent } from "@tiptap/core";
import { Mark } from "prosemirror-model";
import { useEffect } from "react";
import CommentBlockComponent from "../../../../../../components/Comments/CommentBlock";
import Input from "../../../../../../components/Comments/Input";
import { CommentBlock } from "../../../../../../ui-logic/CommentBlock";

interface CommentProps {
	mark: Mark;
	element: HTMLElement;
	onDelete: () => void;
	onUpdate: (commentBlock: CommentBlock) => void;
	onConfirm: (content: JSONContent[]) => void;
	className?: string;
}

const Comment = (props: CommentProps) => {
	const { mark, element, onDelete, onUpdate, onConfirm, className } = props;

	useEffect(() => {
		element.style.color = "var(--color-comment-active-text)";
		element.style.background = "var(--color-comment-active-bg)";
		return () => {
			element.style.color = "var(--color-article-text)";
			element.style.background = "var(--color-comment-bg)";
		};
	}, [mark?.attrs?.count]);

	if (mark?.attrs?.comment) {
		return (
			<div className={className} data-comment={true}>
				<CommentBlockComponent
					maxHeight="50vh"
					commentBlock={mark.attrs as any}
					onUpdate={onUpdate}
					onDeleteComment={onDelete}
				/>
			</div>
		);
	}

	return (
		<div className={className}>
			<div className="add-input" data-qa="qa-add-comment">
				<Input
					onCancel={onDelete}
					onConfirm={onConfirm}
					placeholder={t("leave-comment")}
					confirmButtonText={t("comment")}
				/>
			</div>
		</div>
	);
};

export default styled(Comment)`
	z-index: 1;
	transition: all var(--transition-time) ease-in-out;
	border-radius: var(--radius-normal);
	background: var(--color-comments-bg);
	box-shadow: var(--comment-tooltip-shadow);

	.add-input {
		padding: 1em;
	}
`;
