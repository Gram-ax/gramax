import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { Editor } from "@tiptap/core";
import Tooltip from "@components/Atoms/Tooltip";
import ButtonsLayout from "@components/Layouts/ButtonLayout";
import ModalLayoutDark from "@components/Layouts/ModalLayoutDark";
import NoteMenuButton from "@ext/markdown/elements/note/edit/components/NoteMenuButton";
import { NoteType } from "@ext/markdown/elements/note/render/component/Note";

const NotesMenuGroup = ({ editor }: { editor?: Editor }) => {
	const note = ButtonStateService.useCurrentAction({ action: "note" });

	const isActive = note.isActive;
	const disabled = note.disabled;

	return (
		<Tooltip
			arrow={false}
			interactive
			distance={8}
			customStyle
			content={
				<ModalLayoutDark>
					<ButtonsLayout>
						{Object.values(NoteType).map((noteType) => {
							if (noteType === NoteType.hotfixes) return null;
							return <NoteMenuButton key={noteType} editor={editor} noteType={noteType} />;
						})}
					</ButtonsLayout>
				</ModalLayoutDark>
			}
		>
			<div>
				<Button
					isActive={isActive}
					onClick={() => editor.chain().focus().toggleNote(NoteType.info).run()}
					disabled={disabled}
					icon="sticky-note"
					style={{ transform: "scale(1, -1)" }}
				/>
			</div>
		</Tooltip>
	);
};

export default NotesMenuGroup;
