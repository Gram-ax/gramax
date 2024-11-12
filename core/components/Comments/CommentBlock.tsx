import { CommentBlock } from "@core-ui/CommentBlock";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { JSONContent } from "@tiptap/react";
import { ReactElement, useEffect, useRef, useState } from "react";
import CommentComponent from "./Comment";
import CommentBlockInput from "./CommentBlockInput";

interface CommentBlockProps {
	commentBlock: CommentBlock;
	maxHeight: string;
	onUpdate: (commentBlock: CommentBlock) => void;
	onDeleteComment?: () => void;
	className?: string;
}

const CommentBlockComponent = (props: CommentBlockProps): ReactElement => {
	const { commentBlock, onUpdate, onDeleteComment, className } = props;
	const confirmAnswerDelelteText = t("confirm-answer-delete");
	const confirmCommentDeleteText = t("confirm-comment-delete");

	const [currentCommentBlock, setCurrentCommentBlock] = useState(Object.assign({}, commentBlock));
	const [focusId, setFocusId] = useState<number>(-2);

	const commentBlockRef = useRef<HTMLDivElement>(null);
	const firstCommentRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLDivElement>(null);
	const user = PageDataContextService.value.userInfo;

	const currentOnDeleteComment = async () => {
		if (!(await confirm(confirmCommentDeleteText))) return;
		if (onDeleteComment) onDeleteComment();
		onUpdate(null);
	};

	const commentOnEdit = (content: JSONContent[]) => {
		currentCommentBlock.comment.content = content;
		onUpdate(currentCommentBlock);

		setCurrentCommentBlock(Object.assign({}, currentCommentBlock));
	};

	const answerOnDelete = async (idx: number) => {
		if (!(await confirm(confirmAnswerDelelteText))) return;

		currentCommentBlock.answers.splice(idx, 1);
		onUpdate(currentCommentBlock);

		setCurrentCommentBlock(Object.assign({}, currentCommentBlock));
	};

	const answerOnEdit = (content: JSONContent[], idx: number) => {
		currentCommentBlock.answers[idx].content = content;
		onUpdate(currentCommentBlock);

		setCurrentCommentBlock(Object.assign({}, currentCommentBlock));
	};

	useEffect(() => {
		if (!commentBlockRef.current) return;
		setTimeout(() => {
			if (!commentBlockRef.current?.scrollTo) return;

			commentBlockRef.current.scrollTo({
				top: commentBlockRef.current.scrollHeight,
				behavior: "smooth",
			});
		}, 150);
	}, []);

	const addAnswer = (content: JSONContent[]) => {
		currentCommentBlock.answers.push({
			user: { mail: user.mail, name: user.name },
			dateTime: new Date().toJSON(),
			content,
		});
		onUpdate(currentCommentBlock);

		setCurrentCommentBlock(Object.assign({}, currentCommentBlock));
	};

	return (
		<div className={className}>
			<div ref={commentBlockRef} className="comment-block">
				<div ref={firstCommentRef} className="first-comment">
					<CommentComponent
						editorId={-1}
						focusId={focusId}
						setFocusId={setFocusId}
						isFirstComment
						comment={currentCommentBlock.comment}
						onDelete={currentOnDeleteComment}
						onEdit={commentOnEdit}
					/>
				</div>
				{currentCommentBlock.answers.map((answer, idx) => (
					<CommentComponent
						key={idx}
						editorId={idx}
						focusId={focusId}
						setFocusId={setFocusId}
						comment={answer}
						onDelete={() => {
							answerOnDelete(idx);
						}}
						onEdit={(content: JSONContent[]) => {
							answerOnEdit(content, idx);
						}}
					/>
				))}
			</div>
			{user && (
				<CommentBlockInput editorId={-2} setFocusId={setFocusId} ref={inputRef} onAddComment={addAnswer} />
			)}
		</div>
	);
};

export default styled(CommentBlockComponent)`
	.comment-block {
		overflow: auto;
		font-family: "Roboto", sans-serif;
		font-size: 1em;
		max-height: ${(p) => p.maxHeight};
	}

	.first-comment {
		top: 0;
		z-index: var(--z-index-foreground);
		padding-top: 1rem;
		border-radius: var(--radius-small) var(--radius-small) 0 0;
		background: var(--color-comments-bg);
	}

	.transition-bg-active {
		top: 0 !important;
		left: 0 !important;
		width: 100% !important;
		height: 100% !important;
		border-radius: var(--radius-small);
	}
`;
