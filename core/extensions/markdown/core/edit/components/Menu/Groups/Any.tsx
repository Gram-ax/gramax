import NotesMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Notes";
import SemiBlocks from "@ext/markdown/core/edit/components/Menu/Groups/SemiBlocks";
import CodeMenuButton from "@ext/markdown/elements/code/edit/components/CodeMenuButton";
import TableMenuButton from "@ext/markdown/elements/table/edit/components/TableMenuButton";
import type { Editor } from "@tiptap/core";

interface AnyMenuGroupProps {
	editor?: Editor;
	includeResources?: boolean;
	fileName?: string;
	isSmallEditor?: boolean;
}

const AnyMenuGroup = ({ editor, includeResources, fileName, isSmallEditor }: AnyMenuGroupProps) => {
	return (
		<>
			<CodeMenuButton editor={editor} />
			<TableMenuButton editor={editor} />
			<NotesMenuGroup editor={editor} />
			<SemiBlocks
				editor={editor}
				fileName={fileName}
				includeResources={includeResources}
				isSmallEditor={isSmallEditor}
			/>
		</>
	);
};

export default AnyMenuGroup;
