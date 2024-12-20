import Portal from "@components/Portal";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import IsMenuBarOpenService from "@core-ui/ContextServices/IsMenuBarOpenService";
import IsSelectedOneNodeService from "@core-ui/ContextServices/IsSelected";
import useWatch from "@core-ui/hooks/useWatch";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import TableMenu from "@ext/markdown/elements/table/edit/components/TableMenu";
import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import MainMenu from "./Menus/Main";

const Menu = styled(({ editor, id, className }: { editor: Editor; id: string; className?: string }) => {
	const [isOpen, setIsOpen] = useState(true);
	const isMenuBarOpenContext = IsMenuBarOpenService.value;

	useWatch(() => {
		setIsOpen(isMenuBarOpenContext);
	}, [isMenuBarOpenContext]);

	useEffect(() => {
		if (!editor) return;
		const { selection, doc } = editor.view.state;
		const isFirst = selection.$from.parent === doc.firstChild;
		if (isOpen && isFirst) setIsOpen(false);
		if (!isOpen && !isFirst) setIsOpen(true);
	}, [editor?.state?.selection]);

	if (!editor) return null;

	return (
		<Portal parentId={id}>
			<div className={className} style={isOpen ? null : { visibility: "hidden" }} data-qa="qa-edit-menu-button">
				<IsSelectedOneNodeService.Provider editor={editor}>
					<ButtonStateService.Provider editor={editor}>
						<TableMenu editor={editor} />
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
