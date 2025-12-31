import { CommentInputProps } from "@ext/markdown/elements/comment/edit/components/Popover/CommentInput";
import { Editor } from "@tiptap/react";
import { IconButton, ProgressIconButton } from "@ui-kit/Button";
import { Divider } from "@ui-kit/Divider";
import { useEffect, useState } from "react";

interface CommentConfirmButtonProps extends Pick<CommentFooterProps, "onConfirm" | "editor"> {
	isNewComment?: boolean;
}

interface CommentFooterProps extends Pick<CommentInputProps, "onConfirm" | "onCancel"> {
	isNewComment?: boolean;
	editor: Editor;
}

const CommentConfirmButton = ({ isNewComment, editor, onConfirm }: CommentConfirmButtonProps) => {
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
	}, [editor.isEmpty]);

	if (!isNewComment) {
		return <ProgressIconButton size="sm" icon="save" onClick={() => onConfirm(editor.getJSON().content)} />;
	}

	return (
		<IconButton
			icon="arrow-up"
			size="xs"
			className="h-auto rounded-full"
			iconClassName="h-3 w-3"
			disabled={disabled}
			onClick={() => onConfirm(editor.getJSON().content)}
		/>
	);
};

export const CommentFooter = (props: CommentFooterProps) => {
	const { onConfirm, onCancel, editor, isNewComment = true } = props;

	return (
		<div className="flex items-center gap-2 ml-auto" style={{ alignSelf: "end" }}>
			{onCancel && (
				<>
					<Divider orientation="vertical" />
					<ProgressIconButton icon="x" onClick={onCancel} />
				</>
			)}
			<CommentConfirmButton isNewComment={isNewComment} editor={editor} onConfirm={onConfirm} />
		</div>
	);
};
