import Portal from "@components/Portal";
import styled from "@emotion/styled";
import { Editor } from "@tiptap/react";
import { ReactNode, useEffect, useState } from "react";
import canDisplayMenu from "@ext/markdown/elements/article/edit/helpers/canDisplayMenu";
import { isActive } from "@core-ui/hooks/useAudioRecorder";
import { ArticleAudioToolbar } from "@ext/ai/components/Audio/Toolbar";
import AudioRecorderService from "@ext/ai/components/Audio/AudioRecorderService";
import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { useMediaQuery } from "@mui/material";

interface MenuProps {
	editor: Editor;
	id: string;
	children: ReactNode;
	className?: string;
}


const Menu = ({ editor, id, className, children }: MenuProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const isEditable = editor?.isEditable;
	const isMobile = useMediaQuery(cssMedia.JSnarrow);
	const { recorderState } = AudioRecorderService.value;

	useEffect(() => {
		if (!editor) return;

		const isEditable = editor?.isEditable;
		if (!isEditable) return setIsOpen(false);

		const canDisplay = canDisplayMenu(editor);

		if (isOpen && !canDisplay) setIsOpen(false);
		if (!isOpen && canDisplay) setIsOpen(true);
	}, [editor?.state?.selection]);

	if (!editor || !isEditable) return null;

	return (
		<Portal parentId={id}>
			<div className={cn(className, isMobile && "mobile")}>
				<div role="bottom-toolbar">
					{isActive(recorderState) && <ArticleAudioToolbar editor={editor} />}
					<div
						data-qa="qa-edit-menu-button"
						className={cn("transition-all", !isOpen && "scroll-hidden", isOpen && "scroll-visible")}
					>
						{children}
					</div>
				</div>
			</div>
		</Portal>
	);
};

export default styled(Menu)`
	gap: 4px;
	display: flex;
	align-items: center;
	flex-direction: column;
	padding-bottom: 0.25rem;

	${cssMedia.narrow} {
		overflow: unset;
		display: block;
		gap: 0;
		margin-left: -1.25rem;
		width: 100vw;
		padding-bottom: 0;
	}

	.scroll-hidden {
		transform: translateY(0.625rem);
		opacity: 0;
		pointer-events: none;
	}

	.scroll-visible {
		transform: translateY(0);
		opacity: 1;
	}

	@media print {
		display: none !important;
	}
`;
