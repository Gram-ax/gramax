import { Comment } from "@core-ui/CommentBlock";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { GlobalEditorIsEditable } from "@ext/markdown/elements/comment/edit/logic/CommentFocusTooltip";
import { JSONContent } from "@tiptap/react";
import { Dispatch, ReactElement, SetStateAction, useContext, useEffect, useState } from "react";
import User from "../../extensions/security/components/User/User";
import Editor from "./CommentEditor";
import InputTransitionWrapper from "./InputTransitionWrapper";
import Menu from "./Menu";

interface CommentComponentProps {
	editorId: number;
	focusId: number;
	setFocusId: Dispatch<SetStateAction<number>>;
	comment: Comment;
	onEdit: (content: JSONContent[]) => void;
	onDelete: () => void;
	onEditorInput?: (content: string) => void;
	isFirstComment?: boolean;
	className?: string;
}

const CommentComponent = (props: CommentComponentProps): ReactElement => {
	const {
		editorId,
		focusId,
		setFocusId,
		comment,
		isFirstComment = false,
		className,
		onEdit,
		onDelete,
		onEditorInput,
	} = props;
	const globalEditorIsEditable = useContext(GlobalEditorIsEditable);
	const [isEditable, setIsEditable] = useState(false);
	const [isActive, setIsActive] = useState(false);
	const userInfo = PageDataContextService.value.userInfo;
	const answerDeleteText = t("delete-answer");
	const commentDeleteText = t("delete-as-resolved");

	const currentOnCancel = () => {
		setIsEditable(false);
	};

	const currentOnEdit = (content: JSONContent[]) => {
		onEdit(content);
		currentOnCancel();
	};

	const isCurrentUserAuthor = () => {
		return comment.user.mail === userInfo?.mail;
	};

	useEffect(() => {
		if (focusId === editorId) setIsEditable(true);
		else setIsEditable(false);
	}, [focusId]);

	const UserInfo = () => {
		if (!userInfo) return null;

		return (
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
		);
	};

	return (
		<InputTransitionWrapper
			trigger={isActive}
			property="padding"
			duration="0.2s"
			borderTop={!isFirstComment}
			borderBottom
		>
			<div className={className}>
				<div className="comment">
					<User
						name={comment.user.name}
						mail={comment.user.mail}
						date={comment.dateTime}
						comment={
							<div className={"editer"}>
								<Editor
									setFocusId={setFocusId}
									placeholder={t("leave-comment")}
									setParentIsActive={setIsActive}
									onInput={onEditorInput}
									onConfirm={currentOnEdit}
									onCancel={currentOnCancel}
									content={comment.content}
									isEditable={isEditable}
									confirmButtonText={t("edit")}
								/>
							</div>
						}
						actions={globalEditorIsEditable && <UserInfo />}
					/>
				</div>
			</div>
		</InputTransitionWrapper>
	);
};

export default styled(CommentComponent)`
	.comment {
		height: auto;
		padding: 0 1em 1em;
	}
`;
