import Portal from "@components/Portal";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import IsMenuBarOpenService from "@core-ui/ContextServices/IsMenuBarOpenService";
import IsSelectedOneNodeService from "@core-ui/ContextServices/IsSelected";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import CodeBlockMenu from "@ext/markdown/elements/code/edit/components/CodeBlockMenu";
import CutMenu from "@ext/markdown/elements/cut/edit/components/CutMenu";
import DiagramsMenu from "@ext/markdown/elements/diagrams/edit/components/DiagramsEditButton";
import DrawioMenu from "@ext/markdown/elements/drawio/edit/components/DrawioMenu";
import ImageMenu from "@ext/markdown/elements/image/edit/components/ImageMenu";
import NoteMenu from "@ext/markdown/elements/note/edit/components/NoteMenu";
import OpenApiMenu from "@ext/markdown/elements/openApi/edit/components/OpenApiEditButton";
import TableMenu from "@ext/markdown/elements/table/edit/components/TableMenu";
import VideoMenu from "@ext/markdown/elements/video/edit/components/VideoMenu";
import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import MainMenu from "./Menus/Main";
export const MenuBarId = "MenuBarId";

const Menu = styled(({ editor, className }: { editor: Editor; className?: string }) => {
	const [isOpen, setIsOpen] = useState(true);
	const isMenuBarOpenContext = IsMenuBarOpenService.value;

	useEffect(() => {
		setIsOpen(isMenuBarOpenContext);
	}, [isMenuBarOpenContext]);

	if (!editor) return null;

	return (
		<Portal parentId={MenuBarId}>
			<div className={className} style={isOpen ? null : { display: "none" }} data-qa="qa-edit-menu-button">
				<IsSelectedOneNodeService.Provider editor={editor}>
					<ButtonStateService.Provider editor={editor}>
						<OpenApiMenu editor={editor} />
						<DiagramsMenu editor={editor} />
						<DrawioMenu editor={editor} />
						<ImageMenu editor={editor} />
						<VideoMenu editor={editor} />
						<CutMenu editor={editor} />
						<CodeBlockMenu editor={editor} />
						<TableMenu editor={editor} />
						<NoteMenu editor={editor} />
						<MainMenu editor={editor} />
					</ButtonStateService.Provider>
				</IsSelectedOneNodeService.Provider>
			</div>
		</Portal>
	);
})`
	gap: 4px;
	display: flex;
	align-items: center;
	flex-direction: column;

	> * {
		box-shadow: var(--shadows-deeplight);
	}

	${cssMedia.narrow} {
		margin-right: -30px;
	}

	@media print {
		display: none !important;
	}
`;

export default Menu;
