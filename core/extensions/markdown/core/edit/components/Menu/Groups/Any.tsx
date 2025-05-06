import ButtonsLayout from "@components/Layouts/ButtonLayout";
import SemiBlocks from "@ext/markdown/core/edit/components/Menu/Groups/SemiBlocks";
import CodeMenuButton from "@ext/markdown/elements/code/edit/components/CodeMenuButton";
import TableMenuButton from "@ext/markdown/elements/table/edit/components/TableMenuButton";
import { Editor } from "@tiptap/core";
import DiagramsMenuGroup from "./Diagrams";
import FilesMenuGroup from "./Files";
import NotesMenuGroup from "@ext/markdown/core/edit/components/Menu/Groups/Notes";

const AnyMenuGroup = ({ editor, includeResources }: { editor?: Editor; includeResources?: boolean }) => {
	return (
		<ButtonsLayout>
			<CodeMenuButton editor={editor} />
			<NotesMenuGroup editor={editor} />
			<TableMenuButton editor={editor} />
			<SemiBlocks editor={editor} includeResources={includeResources} />
			{includeResources && (
				<>
					<DiagramsMenuGroup editor={editor} />
					<FilesMenuGroup editor={editor} />
				</>
			)}
		</ButtonsLayout>
	);
};

export default AnyMenuGroup;
