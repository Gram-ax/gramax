import ButtonsLayout from "@components/Layouts/ButtonLayout";
import CodeMenuButton from "@ext/markdown/elements/code/edit/components/CodeMenuButton";
import CommentMenuButton from "@ext/markdown/elements/comment/edit/components/CommentMenuButton";
import FileMenuButton from "@ext/markdown/elements/file/edit/components/FileMenuButton";
import LinkMenuButton from "@ext/markdown/elements/link/edit/components/LinkMenuButton";
import ClearDecorationMenuButton from "@ext/markdown/elements/сlearDecoration/editor/components/ClearDecorationMenuButton";
import { Editor } from "@tiptap/core";

const InlineMenuGroup = ({
	editor,
	onClick,
	onFileSave,
}: {
	editor?: Editor;
	onClick?: () => void;
	onFileSave?: () => void;
}) => {
	return (
		<ButtonsLayout onClick={onClick}>
			<LinkMenuButton editor={editor} />
			<CodeMenuButton editor={editor} />
			<FileMenuButton onSave={onFileSave} editor={editor} />
			<div className="divider" />
			<ClearDecorationMenuButton editor={editor} />
			<div className="divider" />
			<CommentMenuButton editor={editor} />
		</ButtonsLayout>
	);
};

export default InlineMenuGroup;
