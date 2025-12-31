import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import t from "@ext/localization/locale/translate";
import { noteIcons, NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { Editor } from "@tiptap/core";
import { NodeType } from "@core-ui/ContextServices/ButtonStateService/hooks/types";
import { Icon } from "@ui-kit/Icon";
import styled from "@emotion/styled";
import { ToolbarDropdownMenuItem } from "@ui-kit/Toolbar";

const getIconColor = (noteType: NoteType) => {
	switch (noteType) {
		case NoteType.quote:
			return "var(--color-admonition-dropdown-quote)";
		case NoteType.lab:
			return "var(--color-admonition-dropdown-lab)";
		case NoteType.tip:
			return "var(--color-admonition-dropdown-tip)";
		case NoteType.note:
			return "var(--color-admonition-dropdown-note)";
		case NoteType.info:
			return "var(--color-admonition-dropdown-info)";
		case NoteType.danger:
			return "var(--color-admonition-dropdown-danger)";
		default:
			return "var(--color-admonition-hotfixes-br-h)";
	}
};

const StyledIcon = styled(Icon)<{ noteType?: NoteType }>`
	color: ${({ noteType }) => getIconColor(noteType)};
`;

interface NoteMenuButtonProps {
	editor: Editor;
	noteType?: Exclude<NoteType, "hotfixes">;
}

const NoteMenuButton = ({ editor, noteType }: NoteMenuButtonProps) => {
	const nodeValues = { action: "note" as NodeType, attrs: { type: noteType } };
	const { isActive, disabled } = ButtonStateService.useCurrentAction(nodeValues);

	return (
		<ToolbarDropdownMenuItem
			disabled={disabled}
			active={isActive}
			onClick={() => editor.chain().focus().toggleNote(noteType).run()}
		>
			<div className="flex flex-row items-center gap-2 mr-3">
				<StyledIcon icon={noteIcons[noteType]} noteType={noteType} />
				<span>{t(`${noteType}-text`)}</span>
			</div>
		</ToolbarDropdownMenuItem>
	);
};

export default NoteMenuButton;
