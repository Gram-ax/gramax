import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import type { CommentInputProps } from "@ext/markdown/elements/comment/edit/components/Popover/CommentInput";
import type { Editor } from "@tiptap/react";
import { Button, IconButton, ProgressIconButton } from "@ui-kit/Button";
import { memo, useEffect, useState } from "react";

interface CommentConfirmButtonProps extends Pick<CommentFooterProps, "onConfirm" | "editor" | "editable"> {
	isNewComment?: boolean;
	disabled?: boolean;
}

interface CommentFooterProps extends Pick<CommentInputProps, "onConfirm" | "onCancel"> {
	isNewComment?: boolean;
	editable?: boolean;
	editor: Editor;
}

const CommentConfirmButton = ({ isNewComment, editor, onConfirm, disabled }: CommentConfirmButtonProps) => {
	if (!isNewComment) {
		return (
			<Button disabled={disabled} onClick={() => onConfirm(editor.getJSON().content)} size="xs" variant="primary">
				{t("save")}
			</Button>
		);
	}

	return (
		<IconButton
			className="h-auto rounded-full"
			disabled={disabled}
			icon="arrow-up"
			iconClassName="h-4 w-4"
			onClick={() => onConfirm(editor.getJSON().content)}
			size="xs"
		/>
	);
};

const CommentCancelButton = ({ onCancel, isNewComment }: { onCancel: () => void; isNewComment: boolean }) => {
	if (!isNewComment) {
		return (
			<Button onClick={onCancel} size="xs" variant="outline">
				{t("cancel")}
			</Button>
		);
	}

	return <ProgressIconButton icon="x" onClick={onCancel} />;
};

export const CommentFooter = memo((props: CommentFooterProps) => {
	const { onConfirm, onCancel, editor, isNewComment = true, editable } = props;
	const [disabled, setDisabled] = useState(isNewComment);

	useEffect(() => {
		if (!editor || editor.isDestroyed) return;

		const onUpdate = ({ editor }: { editor: Editor }) => {
			setDisabled(editor.isEmpty);
		};

		editor.on("update", onUpdate);
		return () => {
			editor.off("update", onUpdate);
		};
	}, [editor]);

	const isOldNotEditableComment = !isNewComment && !editable;

	return (
		<div
			className={cn("flex items-center gap-1.5 ml-auto transition-all", !isNewComment && "w-full justify-end")}
			style={{
				alignSelf: "end",
				...(!isNewComment
					? {
							height: isOldNotEditableComment ? "0" : "1.75rem",
							opacity: isOldNotEditableComment ? "0" : "1",
							pointerEvents: isOldNotEditableComment ? "none" : "auto",
						}
					: {}),
			}}
		>
			{onCancel && <CommentCancelButton isNewComment={isNewComment} onCancel={onCancel} />}
			<CommentConfirmButton
				disabled={disabled}
				editor={editor}
				isNewComment={isNewComment}
				onConfirm={onConfirm}
			/>
		</div>
	);
});
