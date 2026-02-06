import NotesMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Notes";
import SemiBlocks from "@ext/markdown/core/edit/components/Menu/Groups/SemiBlocks";
import CodeMenuButton from "@ext/markdown/elements/code/edit/components/CodeMenuButton";
import TableMenuButton from "@ext/markdown/elements/table/edit/components/TableMenuButton";
import { Editor } from "@tiptap/core";
import DiagramsMenuGroup from "./Diagrams";
import FilesMenuGroup from "./Files";

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
			{includeResources && <DiagramsMenuGroup editor={editor} fileName={fileName} />}
			<SemiBlocks editor={editor} includeResources={includeResources} isSmallEditor={isSmallEditor} />
			{includeResources && <FilesMenuGroup editor={editor} fileName={fileName} isSmallEditor={isSmallEditor} />}
		</>
	);
};

export default AnyMenuGroup;
