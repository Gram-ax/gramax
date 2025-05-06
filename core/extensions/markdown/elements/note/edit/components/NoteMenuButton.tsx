import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import { noteIcons, NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { Editor } from "@tiptap/core";
import { NodeType } from "@core-ui/ContextServices/ButtonStateService/hooks/types";

interface NoteMenuButtonProps {
	editor: Editor;
	noteType?: Exclude<NoteType, "hotfixes">;
}

const NoteMenuButton = ({ editor, noteType }: NoteMenuButtonProps) => {
	const nodeValues = { action: "note" as NodeType, attrs: { type: noteType } };
	const { isActive, disabled } = ButtonStateService.useCurrentAction(nodeValues);

	return (
		<Button
			onClick={() => editor.chain().focus().toggleNote(noteType).run()}
			icon={noteIcons[noteType] || "sticky-note"}
			iconStyle={!isActive && !disabled && noteType ? { color: `var(--color-admonition-${noteType}-br-h)` } : {}}
			tooltipText={noteType ? t(`${noteType}-text`) : t("editor.note")}
			nodeValues={nodeValues}
		/>
	);
};

export default NoteMenuButton;
