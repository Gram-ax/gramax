import { Editor } from "@tiptap/core";
import CutMenuButton from "@ext/markdown/elements/cut/edit/components/CutMenuButton";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import CodeMenuButton from "@ext/markdown/elements/code/edit/components/CodeMenuButton";
import NoteMenuButton from "@ext/markdown/elements/note/edit/components/NoteMenuButton";
import TableMenuButton from "@ext/markdown/elements/table/edit/components/TableMenuButton";
import BlockquoteMenuButton from "@ext/markdown/elements/blockquote/components/BlockquoteMenuButton";
import DiagramsMenuGroup from "./Diagrams";
import FilesMenuGroup from "./Files";

const AnyMenuGroup = ({ editor }: { editor?: Editor }) => {
	return (
		<ButtonsLayout>
			<CodeMenuButton editor={editor} />
			<NoteMenuButton editor={editor} />
			<TableMenuButton editor={editor} />
			<BlockquoteMenuButton editor={editor} />
			<CutMenuButton editor={editor} />
			<DiagramsMenuGroup editor={editor} />
			<FilesMenuGroup editor={editor} />
		</ButtonsLayout>
	);
};

export default AnyMenuGroup;
