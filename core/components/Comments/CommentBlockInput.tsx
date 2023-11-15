import styled from "@emotion/styled";
import { JSONContent } from "@tiptap/react";
import React, { Dispatch, MutableRefObject, SetStateAction, useEffect, useState } from "react";
import useLocalize from "../../extensions/localization/useLocalize";
import Input from "./Input";
import InputTransitionWrapper from "./InputTransitionWrapper";

export const CommentBlockInput = styled(
	React.forwardRef(
		(
			{
				transitionDuration,
				editorId,
				focusId,
				setFocusId,
				onAddComment,
				onCancel,
				onInput,
				className,
			}: {
				transitionDuration: number;
				editorId: number;
				focusId: number;
				setFocusId: Dispatch<SetStateAction<number>>;
				onAddComment: (content: JSONContent[]) => void;
				onCancel?: () => void;
				onInput?: (content: string) => void;
				className?: string;
			},
			ref?: MutableRefObject<HTMLDivElement>,
		) => {
			const [isEditorActive, setIsEditorActive] = useState(false);
			const [openButtons, setOpenButtons] = useState(true);

			const onCurrentCancel = () => {
				if (onCancel) onCancel();
			};

			const onCurrentConfirm = (content: JSONContent[]) => {
				onAddComment(content);
			};

			const onCurrentInput = (content: string) => {
				if (onInput) onInput(content);
				setOpenButtons(true);
			};

			const onEditorClick = () => {
				setFocusId(editorId);
				setOpenButtons(true);
			};

			useEffect(() => {
				if (editorId !== focusId) setOpenButtons(false);
			}, [focusId]);

			return (
				<InputTransitionWrapper
					trigger={isEditorActive && openButtons}
					property="padding"
					duration={`${transitionDuration / 1000}s`}
					borderTop
				>
					<div ref={ref} className={className}>
						<div
							className={"transition-bg" + (isEditorActive && openButtons ? " transition-bg-active" : "")}
						/>
						<div className="input">
							<Input
								confirmButtonText={useLocalize("comment")}
								placeholder={useLocalize("leaveAComment")}
								setParentIsActive={setIsEditorActive}
								onEditorClick={onEditorClick}
								onConfirm={onCurrentConfirm}
								onCancel={onCurrentCancel}
								openButtons={openButtons}
								setFocusId={setFocusId}
								onInput={onCurrentInput}
							/>
						</div>
					</div>
				</InputTransitionWrapper>
			);
		},
	),
)`
	padding: 1rem;
	border-top: 0.1px solid var(--color-line-comment);

	.input {
		width: 406px;
	}

	.transition-bg {
		top: 50%;
		width: 0;
		left: 50%;
		height: 0;
		z-index: -1;
		position: absolute;
		transition: all 0.2s;
		background: var(--color-comments-bg);
	}
`;
export default CommentBlockInput;
