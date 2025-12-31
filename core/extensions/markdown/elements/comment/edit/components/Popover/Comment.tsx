import { CommentBlock, CommentUser } from "@core-ui/CommentBlock";
import useWatch from "@core-ui/hooks/useWatch";
import { CommentContent } from "@ext/markdown/elements/comment/edit/components/Popover/CommentContent";
import { CommentHeader } from "@ext/markdown/elements/comment/edit/components/Popover/CommentHeader";
import { CommentMessage } from "@ext/markdown/elements/comment/edit/components/Popover/CommentMessage";
import GlobalEditorIsEditable from "@ext/markdown/elements/comment/edit/logic/GlobalIsEditable";
import { JSONContent } from "@tiptap/core";
import { Divider } from "@ui-kit/Divider";
import { ScrollShadowContainer } from "@ui-kit/ScrollShadowContainer";
import { useCallback, useContext, useEffect, useRef } from "react";

interface CommentProps {
	data: CommentBlock;
	user: CommentUser;
	onClose: () => void;
	onDelete: () => void;
	onCreate: (comment: CommentBlock) => void;
	onAddAnswer: (comment: CommentBlock, hide: boolean) => void;
	onDeleteAnswer: (comment: CommentBlock) => void;
}

export const Comment = (props: CommentProps) => {
	const { data, user, onClose, onDelete, onCreate, onAddAnswer, onDeleteAnswer: onDeleteAnswerProp } = props;
	const dataRef = useRef<CommentBlock>(data);
	const scrollShadowContainerRef = useRef<HTMLDivElement>(null);
	const isNewComment = !data?.comment;
	const isEditable = useContext(GlobalEditorIsEditable);

	useWatch(() => {
		dataRef.current = data;
	}, [data]);

	useEffect(() => {
		const scrollableElement = scrollShadowContainerRef.current;
		if (!scrollableElement) return;
		if (!scrollableElement?.scrollTo) return;

		scrollableElement.scrollTo({
			top: scrollableElement.scrollHeight,
		});
	}, []);

	const onCreateComment = useCallback(
		(index: number, content: JSONContent[]) => {
			onCreate({ comment: { dateTime: new Date().toISOString(), user, content } });
		},
		[onCreate, user],
	);

	const onEditMainComment = useCallback(
		(index: number, content: JSONContent[]) => {
			const data = dataRef.current;

			onAddAnswer(
				{
					...data,
					comment: { ...data.comment, content },
				},
				false,
			);
		},
		[onCreate, user],
	);

	const onAddCommentAnswer = useCallback(
		(index: number, content: JSONContent[], hide: boolean = true) => {
			const data = dataRef.current;
			if (index > data.answers.length) {
				return onAddAnswer(
					{
						...data,
						answers: [...data.answers, { dateTime: new Date().toISOString(), user, content }],
					},
					true,
				);
			}

			onAddAnswer(
				{
					...data,
					answers: data.answers.map((answer, i) => (i + 1 === index ? { ...answer, content } : answer)),
				},
				hide,
			);
		},
		[onAddAnswer, user],
	);

	const onDeleteAnswer = useCallback(
		(index: number) => {
			const data = dataRef.current;
			onDeleteAnswerProp({
				...data,
				answers: data.answers.filter((_, i) => i + 1 !== index),
			});
		},
		[onDeleteAnswerProp],
	);

	if (isNewComment) {
		return (
			<CommentContent data-qa="qa-add-comment">
				<div className="px-2.5 py-2">
					<CommentMessage
						autofocus
						index={0}
						last
						isCurrentUser
						user={user}
						editable
						showName={false}
						onConfirm={onCreateComment}
					/>
				</div>
			</CommentContent>
		);
	}

	const isCurrentUser = isEditable ? data.comment.user.mail === user.mail : false;

	return (
		<CommentContent>
			<CommentHeader onClose={onClose} onResolve={onDelete} renderDeleteIcon={isEditable} />
			<ScrollShadowContainer ref={scrollShadowContainerRef} className="scroll-area">
				<div className="px-3 py-3">
					{data.comment && (
						<CommentMessage
							index={0}
							isCurrentUser={isCurrentUser}
							user={data.comment.user}
							last={!data?.answers?.length}
							date={data.comment.dateTime}
							content={data.comment.content}
							onConfirm={onEditMainComment}
						/>
					)}
					{data.answers &&
						data.answers.map((answer, index) => (
							<CommentMessage
								key={answer.dateTime}
								index={index + 1}
								user={answer.user}
								isCurrentUser={isCurrentUser}
								date={answer.dateTime}
								last={index === data.answers.length - 1}
								content={answer.content}
								onConfirm={onAddCommentAnswer}
								onDelete={onDeleteAnswer}
							/>
						))}
				</div>
			</ScrollShadowContainer>
			{isEditable && (
				<>
					<Divider />
					<CommentMessage
						last
						isCurrentUser
						editable
						className="mt-2 flex-shrink-0 px-2.5 pb-2"
						index={data.answers.length + 1}
						user={user}
						showName={false}
						onConfirm={onAddCommentAnswer}
					/>
				</>
			)}
		</CommentContent>
	);
};
