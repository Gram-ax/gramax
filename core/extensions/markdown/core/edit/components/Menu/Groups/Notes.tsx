import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { getEditorStore } from "@core-ui/stores/EditorStore";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import NoteMenuButton from "@ext/markdown/elements/note/edit/components/NoteMenuButton";
import { NoteType, noteIcons } from "@ext/markdown/elements/note/render/component/Note";
import type { Editor } from "@tiptap/core";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { ToolbarIcon, ToolbarToggleButton, ToolbarTriggerChevron } from "@ui-kit/Toolbar";
import { useCallback } from "react";

const NotesMenuGroup = ({ editor }: { editor?: Editor }) => {
	const note = ButtonStateService.useCurrentAction({ action: "note" });
	const lastUsedNoteType: Exclude<NoteType, "hotfixes"> =
		editor?.getAttributes("note")?.type || getEditorStore().lastUsedNoteType || NoteType.info;

	const onCloseAutoFocus = useCallback(
		(event: Event) => {
			event.preventDefault();
			editor?.commands.focus();
		},
		[editor],
	);

	return (
		<>
			<ToolbarToggleButton
				active={note.isActive}
				data-testid="tb-note"
				disabled={note.disabled}
				onClick={() => editor?.chain().focus().toggleNote(lastUsedNoteType).run()}
				tooltipText={t(`${lastUsedNoteType}-text`)}
			>
				<ToolbarIcon
					className={cn(lastUsedNoteType === NoteType.quote && "transform scale(1, -1)")}
					data-type={NoteType.quote}
					icon={noteIcons[lastUsedNoteType] as IconCode}
				/>
			</ToolbarToggleButton>
			<ComponentVariantProvider variant="inverse">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<ToolbarTriggerChevron data-testid="tb-notes" disabled={note.disabled} sub />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="lg:shadow-hard-base"
						onCloseAutoFocus={onCloseAutoFocus}
						side="top"
						sideOffset={8}
					>
						<DropdownMenuLabel className="font-normal text-inverse-muted">
							{t("editor.notes")}
						</DropdownMenuLabel>
						<NoteMenuButton editor={editor} noteType={NoteType.quote} />
						<NoteMenuButton editor={editor} noteType={NoteType.info} />
						<NoteMenuButton editor={editor} noteType={NoteType.tip} />
						<NoteMenuButton editor={editor} noteType={NoteType.lab} />
						<NoteMenuButton editor={editor} noteType={NoteType.note} />
						<NoteMenuButton editor={editor} noteType={NoteType.danger} />
					</DropdownMenuContent>
				</DropdownMenu>
			</ComponentVariantProvider>
		</>
	);
};

export default NotesMenuGroup;
