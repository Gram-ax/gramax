import ButtonsLayout from "@components/Layouts/ButtonLayout";
import SemiBlocks from "@ext/markdown/core/edit/components/Menu/Groups/SemiBlocks";
import CodeMenuButton from "@ext/markdown/elements/code/edit/components/CodeMenuButton";
import NoteMenuButton from "@ext/markdown/elements/note/edit/components/NoteMenuButton";
import TableMenuButton from "@ext/markdown/elements/table/edit/components/TableMenuButton";
import { Editor } from "@tiptap/core";
import DiagramsMenuGroup from "./Diagrams";
import FilesMenuGroup from "./Files";

const AnyMenuGroup = ({ editor }: { editor?: Editor }) => {
	return (
		<ButtonsLayout>
			<CodeMenuButton editor={editor} />
			<NoteMenuButton editor={editor} />
			<TableMenuButton editor={editor} />
			<SemiBlocks editor={editor} />
			<DiagramsMenuGroup editor={editor} />
			<FilesMenuGroup editor={editor} />
		</ButtonsLayout>
	);
};

export default AnyMenuGroup;
