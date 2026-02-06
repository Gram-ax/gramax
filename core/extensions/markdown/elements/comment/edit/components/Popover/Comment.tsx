import type { CommentBlock, CommentUser } from "@core-ui/CommentBlock";
import useWatch from "@core-ui/hooks/useWatch";
import { CommentContent } from "@ext/markdown/elements/comment/edit/components/Popover/CommentContent";
import { CommentHeader } from "@ext/markdown/elements/comment/edit/components/Popover/CommentHeader";
import { CommentMessage } from "@ext/markdown/elements/comment/edit/components/Popover/CommentMessage";
import GlobalEditorIsEditable from "@ext/markdown/elements/comment/edit/logic/GlobalIsEditable";
import type { JSONContent } from "@tiptap/core";
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
		(_: number, content: JSONContent[]) => {
			onCreate({ comment: { dateTime: new Date().toISOString(), user, content } });
		},
		[onCreate, user],
	);

	const onEditMainComment = useCallback(
		(_: number, content: JSONContent[]) => {
			const data = dataRef.current;

			onAddAnswer(
				{
					...data,
					comment: { ...data.comment, content },
				},
				false,
			);
		},
		[onAddAnswer],
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
				<div>
					<CommentMessage
						autofocus
						editable
						index={0}
						isCurrentUser
						last
						onConfirm={onCreateComment}
						showAvatar={false}
						showName={false}
						user={user}
					/>
				</div>
			</CommentContent>
		);
	}

	const isCurrentUser = isEditable ? data.comment.user.mail === user.mail : false;

	return (
		<CommentContent>
			<CommentHeader onClose={onClose} onResolve={onDelete} renderDeleteIcon={isEditable} />
			<ScrollShadowContainer className="scroll-area" ref={scrollShadowContainerRef}>
				<div className="px-1 py-1">
					{data.comment && (
						<CommentMessage
							content={data.comment.content}
							date={data.comment.dateTime}
							index={0}
							isCurrentUser={isCurrentUser}
							last={!data?.answers?.length}
							onConfirm={onEditMainComment}
							user={data.comment.user}
						/>
					)}
					{data?.answers.map((answer, index) => (
						<CommentMessage
							content={answer.content}
							date={answer.dateTime}
							index={index + 1}
							isCurrentUser={isCurrentUser}
							key={answer.dateTime}
							last={index === data.answers.length - 1}
							onConfirm={onAddCommentAnswer}
							onDelete={onDeleteAnswer}
							user={answer.user}
						/>
					))}
				</div>
			</ScrollShadowContainer>
			{isEditable && (
				<>
					<Divider />
					<CommentMessage
						className="flex-shrink-0 p-1"
						editable
						index={data.answers.length + 1}
						isCurrentUser
						last
						onConfirm={onAddCommentAnswer}
						showName={false}
						user={user}
					/>
				</>
			)}
		</CommentContent>
	);
};
