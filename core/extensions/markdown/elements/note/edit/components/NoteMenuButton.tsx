import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import type { NodeType } from "@core-ui/ContextServices/ButtonStateService/hooks/types";
import { setEditorStore } from "@core-ui/stores/EditorStore";
import t from "@ext/localization/locale/translate";
import getIconColor from "@ext/markdown/elements/note/edit/logic/getNoteButtonIconColor";
import { type NoteType, noteIcons } from "@ext/markdown/elements/note/render/component/Note";
import type { Editor } from "@tiptap/core";
import { Icon } from "@ui-kit/Icon";
import { ToolbarDropdownMenuItem } from "@ui-kit/Toolbar";
import { useCallback } from "react";

interface NoteMenuButtonProps {
	editor: Editor;
	noteType?: Exclude<NoteType, "hotfixes">;
}

const NoteMenuButton = ({ editor, noteType }: NoteMenuButtonProps) => {
	const nodeValues = { action: "note" as NodeType, attrs: { type: noteType } };
	const { isActive, disabled } = ButtonStateService.useCurrentAction(nodeValues);

	const onSelectNote = useCallback(() => {
		editor.chain().focus().toggleNote(noteType).run();
		setEditorStore({ lastUsedNoteType: noteType });
	}, [editor, noteType]);

	return (
		<ToolbarDropdownMenuItem active={isActive} disabled={disabled} onClick={onSelectNote}>
			<div className="flex flex-row items-center gap-2 mr-3">
				<Icon color={getIconColor(noteType)} icon={noteIcons[noteType] as IconCode} />
				<span>{t(`${noteType}-text`)}</span>
			</div>
		</ToolbarDropdownMenuItem>
	);
};

export default NoteMenuButton;
