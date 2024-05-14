import { CommentBlock } from "@core-ui/CommentBlock";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import { JSONContent } from "@tiptap/react";
import { ReactElement, useEffect, useRef, useState } from "react";
import useLocalize from "../../extensions/localization/useLocalize";
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
	const confirmAnswerDelelteText = useLocalize("confirmAnswerDelete");
	const confirmCommentDeleteText = useLocalize("confirmCommentDelete");

	const [currentCommentBlock, setCurrentCommentBlock] = useState(Object.assign({}, commentBlock));
	const [focusId, setFocusId] = useState<number>(-2);
	const [inputContent, setInputContent] = useState("");

	const commentBlockRef = useRef<HTMLDivElement>(null);
	const firstCommentRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLDivElement>(null);
	const user = PageDataContextService.value.userInfo;
	const transitionDuration = 200;

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

	const addAnswer = (content: JSONContent[]) => {
		currentCommentBlock.answers.push({
			user: { mail: user.mail, name: user.name },
			dateTime: new Date().toJSON(),
			content,
		});
		onUpdate(currentCommentBlock);

		setCurrentCommentBlock(Object.assign({}, currentCommentBlock));
	};

	// const handleScroll = () => {
	// 	if (commentBlockRef.current.scrollTop !== 0) {
	// 		firstCommentRef.current.style.boxShadow = "var(--shadows-deeplight)";
	// 	} else {
	// 		firstCommentRef.current.style.boxShadow = "";
	// 	}
	// };

	const onEditorInput = (content: string) => {
		setInputContent(content);
	};

	useEffect(() => {
		if (!commentBlockRef.current) return;
		setTimeout(() => {
			if (!commentBlockRef.current?.scrollTo) return;

			commentBlockRef.current.scrollTo({
				top: commentBlockRef.current.scrollHeight,
				behavior: "smooth",
			});
		}, transitionDuration);
	}, [inputContent]);

	return (
		<div className={className}>
			<div
				ref={commentBlockRef}
				className="comment-block"
				// onScroll={handleScroll}
			>
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
				{(currentCommentBlock?.answers ?? []).map((answer, idx) => (
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
				<CommentBlockInput
					transitionDuration={transitionDuration}
					editorId={-2}
					focusId={focusId}
					setFocusId={setFocusId}
					ref={inputRef}
					onInput={onEditorInput}
					onAddComment={addAnswer}
				/>
			)}
		</div>
	);
};

export default styled(CommentBlockComponent)`
	.comment-block {
		overflow: auto;
		font-family: "Roboto", sans-serif;
		font-size: 15px;
		max-height: ${(p) => p.maxHeight};
	}

	.first-comment {
		top: 0;
		z-index: 1;
		padding-top: 1rem;
		border-radius: 4px 4px 0 0;
		background: var(--color-comments-bg);
	}

	.transition-bg-active {
		top: 0 !important;
		left: 0 !important;
		width: 100% !important;
		height: 100% !important;
		border-radius: var(--radius-normal);
	}
`;
