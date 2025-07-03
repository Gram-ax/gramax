import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { JSONContent } from "@tiptap/core";
import { Mark } from "prosemirror-model";
import { useEffect, useState } from "react";
import CommentBlockComponent from "../../../../../../components/Comments/CommentBlock";
import Input from "../../../../../../components/Comments/Input";
import { CommentBlock } from "../../../../../../ui-logic/CommentBlock";
import { EditorView } from "prosemirror-view";
import { classNames } from "@components/libs/classNames";

interface CommentProps {
	mark: Mark;
	view: EditorView;
	element: HTMLElement;
	onDelete: () => void;
	onUpdate: (commentBlock: CommentBlock) => void;
	onConfirm: (content: JSONContent[]) => void;
	className?: string;
}

const Wrapper = styled.div`
	z-index: var(--z-index-popover);
	font-size: 14px;
	width: 30em;
`;

const Comment = (props: CommentProps) => {
	const { mark, element, onDelete, onUpdate, onConfirm, className } = props;
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		element.style.color = "var(--color-comment-active-text)";
		element.style.background = "var(--color-comment-active-bg)";

		return () => {
			element.style.color = "var(--color-article-text)";
			element.style.background = "var(--color-comment-bg)";
		};
	}, [mark?.attrs?.count]);

	const onLoaded = () => {
		setIsLoaded(true);
	};

	if (mark?.attrs?.comment) {
		if (!Array.isArray(mark.attrs.answers)) (mark.attrs as CommentBlock).answers = [];
		return (
			<Wrapper className={classNames(className, { isLoaded })} data-comment={true}>
				<CommentBlockComponent
					maxHeight="50vh"
					onLoaded={onLoaded}
					commentBlock={mark.attrs as CommentBlock}
					onUpdate={onUpdate}
					onDeleteComment={onDelete}
				/>
			</Wrapper>
		);
	}

	return (
		<Wrapper className={classNames(className, { isLoaded })}>
			<div className="add-input" data-qa="qa-add-comment">
				<Input
					onCancel={onDelete}
					onConfirm={onConfirm}
					onLoaded={onLoaded}
					placeholder={t("leave-comment")}
					confirmButtonText={t("comment-on")}
				/>
			</div>
		</Wrapper>
	);
};

export default styled(Comment)`
	z-index: var(--z-index-foreground);
	border-radius: var(--radius-x-large);
	overflow: hidden;
	background: var(--color-comments-bg);
	box-shadow: var(--comment-tooltip-shadow);
	opacity: 0;

	&.isLoaded {
		opacity: 1;
	}

	.add-input {
		padding: 1em;
	}
`;
