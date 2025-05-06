import Portal from "@components/Portal";
import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import IsMenuBarOpenService from "@core-ui/ContextServices/IsMenuBarOpenService";
import IsSelectedOneNodeService from "@core-ui/ContextServices/IsSelected";
import useWatch from "@core-ui/hooks/useWatch";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import { Editor } from "@tiptap/react";
import { ReactNode, useEffect, useState } from "react";
import canDisplayMenu from "@ext/markdown/elements/article/edit/helpers/canDisplayMenu";

interface MenuProps {
	editor: Editor;
	id: string;
	children: ReactNode;
	className?: string;
}

const Menu = ({ editor, id, className, children }: MenuProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const { isOpen: isMenuBarOpen } = IsMenuBarOpenService.value;
	const isEditable = editor?.isEditable;

	useWatch(() => {
		setIsOpen(isMenuBarOpen);
	}, [isMenuBarOpen]);

	useEffect(() => {
		if (!editor) return;
		const canDisplay = canDisplayMenu(editor);

		if (isOpen && canDisplay) setIsOpen(false);
		if (!isOpen && !canDisplay) setIsOpen(true);
	}, [editor?.state?.selection]);

	if (!editor || !isEditable) return null;

	return (
		<Portal parentId={id}>
			<div className={className} style={isOpen ? null : { visibility: "hidden" }} data-qa="qa-edit-menu-button">
				<IsSelectedOneNodeService.Provider editor={editor}>
					<ButtonStateService.Provider editor={editor}>{children}</ButtonStateService.Provider>
				</IsSelectedOneNodeService.Provider>
			</div>
		</Portal>
	);
};

export default styled(Menu)`
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
