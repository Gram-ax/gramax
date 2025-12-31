import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import { Editor } from "@tiptap/core";
import NoteMenuButton from "@ext/markdown/elements/note/edit/components/NoteMenuButton";
import { NoteType } from "@ext/markdown/elements/note/render/component/Note";
import { ToolbarDropdownMenuContent, ToolbarIcon, ToolbarToggleButton } from "@ui-kit/Toolbar";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { DropdownMenu, DropdownMenuLabel, DropdownMenuTrigger, useHoverDropdown } from "@ui-kit/Dropdown";
import t from "@ext/localization/locale/translate";
import styled from "@emotion/styled";
import { useCallback } from "react";
import { cn } from "@core-ui/utils/cn";
import { useMediaQuery } from "@mui/material";
import { cssMedia } from "@core-ui/utils/cssUtils";

const StyledToolbarIcon = styled(ToolbarIcon)`
	transform: scale(1, -1);
`;

const NotesMenuGroup = ({ editor }: { editor?: Editor }) => {
	const isMobile = useMediaQuery(cssMedia.JSnarrow);
	const note = ButtonStateService.useCurrentAction({ action: "note" });
	const { isOpen, setIsOpen, handleMouseEnter, handleMouseLeave } = useHoverDropdown();

	const onMouseLeave = useCallback(() => {
		handleMouseLeave();
		if (!isMobile) editor.commands.focus(undefined, { scrollIntoView: false });
	}, [editor, handleMouseLeave, isMobile]);

	const disabled = note.disabled;

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!isMobile) return;
			setIsOpen(open);
		},
		[isMobile],
	);

	const onInteractOutside = useCallback(() => {
		if (isMobile) return;
		setIsOpen(false);
	}, [isMobile]);

	return (
		<ComponentVariantProvider variant="inverse">
			<div
				tabIndex={-1}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={onMouseLeave}
				className={cn(disabled && "pointer-events-none")}
			>
				<DropdownMenu open={isOpen} onOpenChange={onOpenChange} modal={false}>
					<DropdownMenuTrigger asChild>
						<ToolbarToggleButton
							active={note.isActive}
							data-open={isOpen ? "open" : "closed"}
							disabled={disabled}
							onClick={() => !isMobile && editor.chain().focus().toggleNote(NoteType.info).run()}
						>
							<StyledToolbarIcon icon="sticky-note" />
						</ToolbarToggleButton>
					</DropdownMenuTrigger>
					<ToolbarDropdownMenuContent
						align="start"
						side="top"
						contentClassName="lg:shadow-hard-base"
						className={cn(!isMobile && "px-3 py-3 pb-2")}
						alignOffset={!isMobile ? -19 : -5}
						onInteractOutside={onInteractOutside}
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
					</ToolbarDropdownMenuContent>
				</DropdownMenu>
			</div>
		</ComponentVariantProvider>
	);
};

export default NotesMenuGroup;
