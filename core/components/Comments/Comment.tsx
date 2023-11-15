import { Comment } from "@core-ui/CommentBlock";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import { JSONContent } from "@tiptap/react";
import { Dispatch, ReactElement, SetStateAction, useEffect, useState } from "react";
import useLocalize from "../../extensions/localization/useLocalize";
import User from "../../extensions/security/components/User/User";
import Editor from "./CommentEditor";
import InputTransitionWrapper from "./InputTransitionWrapper";
import Menu from "./Menu";

const CommentComponent = styled(
	({
		editorId,
		focusId,
		setFocusId,
		comment,
		onEdit,
		onDelete,
		onEditorInput,
		isFirstComment = false,
		className,
	}: {
		editorId: number;
		focusId: number;
		setFocusId: Dispatch<SetStateAction<number>>;
		comment: Comment;
		onEdit: (content: JSONContent[]) => void;
		onDelete: () => void;
		onEditorInput?: (content: string) => void;
		isFirstComment?: boolean;
		className?: string;
	}): ReactElement => {
		const [isEditable, setIsEditable] = useState(false);
		const [isActive, setIsActive] = useState(false);
		const userInfo = PageDataContextService.value.userInfo;
		const answerDeleteText = useLocalize("deleteAnswer");
		const commentDeleteText = useLocalize("deleteAsResolved");

		const currentOnCancel = () => {
			setIsEditable(false);
		};

		const currentOnEdit = (content: JSONContent[]) => {
			onEdit(content);
			currentOnCancel();
		};

		const isCurrentUserAuthor = (): boolean => {
			return comment.user.mail === userInfo?.mail;
		};

		useEffect(() => {
			if (focusId === editorId) setIsEditable(true);
			else setIsEditable(false);
		}, [focusId]);

		return (
			<InputTransitionWrapper
				trigger={isActive}
				property="padding"
				duration="0.2s"
				borderTop={!isFirstComment}
				borderBottom
			>
				<div className={className}>
					<div className={"transition-bg" + (isActive ? " transition-bg-active" : "")} />
					<div className="comment">
						<User
							name={comment.user.name}
							mail={comment.user.mail}
							date={comment.dateTime}
							comment={
								<div className={"editer"}>
									<Editor
										setFocusId={setFocusId}
										placeholder={useLocalize("leaveAComment")}
										setParentIsActive={setIsActive}
										onInput={onEditorInput}
										onConfirm={currentOnEdit}
										onCancel={currentOnCancel}
										content={comment.content}
										isEditable={isEditable}
										confirmButtonText={useLocalize("edit")}
									/>
								</div>
							}
							actions={
								userInfo ? (
									<div contentEditable={false} className="comment-handle-actions">
										{isCurrentUserAuthor() ? (
											<Menu
												showEditButton={true}
												deleteText={isFirstComment ? commentDeleteText : answerDeleteText}
												deleteOnClick={onDelete}
												editOnClick={() => {
													setFocusId(editorId);
												}}
											/>
										) : isFirstComment ? (
											<Menu
												showEditButton={false}
												deleteText={commentDeleteText}
												deleteOnClick={onDelete}
												editOnClick={() => {
													setFocusId(editorId);
												}}
											/>
										) : null}
									</div>
								) : null
							}
						/>
					</div>
				</div>
			</InputTransitionWrapper>
		);
	},
)`
	.comment {
		height: auto;
		padding: 0rem 1rem 1rem;
	}
`;

export default CommentComponent;
