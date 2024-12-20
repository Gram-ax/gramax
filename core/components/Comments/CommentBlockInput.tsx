import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { JSONContent } from "@tiptap/react";
import React, { Dispatch, MutableRefObject, SetStateAction } from "react";
import Input from "./Input";

export const CommentBlockInput = styled(
	React.forwardRef(
		(
			{
				editorId,
				setFocusId,
				onAddComment,
				onCancel,
				onInput,
				className,
			}: {
				editorId: number;
				setFocusId: Dispatch<SetStateAction<number>>;
				onAddComment: (content: JSONContent[]) => void;
				onCancel?: () => void;
				onInput?: (content: string) => void;
				className?: string;
			},
			ref?: MutableRefObject<HTMLDivElement>,
		) => {
			const onCurrentCancel = () => {
				if (onCancel) onCancel();
			};

			const onCurrentConfirm = (content: JSONContent[]) => {
				onAddComment(content);
			};

			const onCurrentInput = (content: string) => {
				if (onInput) onInput(content);
			};

			const onEditorClick = () => {
				setFocusId(editorId);
			};

			return (
				<div ref={ref} className={className}>
					<div className="input">
						<Input
							confirmButtonText={t("comment")}
							placeholder={t("leave-comment")}
							onEditorClick={onEditorClick}
							onConfirm={onCurrentConfirm}
							onCancel={onCurrentCancel}
							setFocusId={setFocusId}
							onInput={onCurrentInput}
						/>
					</div>
				</div>
			);
		},
	),
)`
	padding: 1em;
	border-top: 0.1px solid var(--color-line-comment);

	.input {
		width: 100%;
	}
`;
export default CommentBlockInput;
