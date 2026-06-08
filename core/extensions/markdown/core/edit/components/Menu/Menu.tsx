import Portal from "@components/Portal";
import { isActive } from "@core-ui/hooks/useAudioRecorder";
import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import { useUnmountAfterTransition } from "@core-ui/hooks/useUnmountAfterTransition";
import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
import AudioRecorderService from "@ext/ai/components/Audio/AudioRecorderService";
import { ArticleAudioToolbar } from "@ext/ai/components/Audio/Toolbar";
import canDisplayMenu from "@ext/markdown/elements/article/edit/helpers/canDisplayMenu";
import type { Editor } from "@tiptap/react";
import { type ReactNode, useEffect, useState } from "react";

interface MenuProps {
	id: string;
	children: ReactNode;
	editor?: Editor;
}

const Menu = ({ editor, id, children }: MenuProps) => {
	const [isOpen, setIsOpen] = useState(canDisplayMenu(editor));
	const isMobile = useMediaQuery(cssMedia.JSnarrow);

	const { recorderState } = AudioRecorderService.value;
	const { shouldMount, isExpanded, onTransitionEnd } = useUnmountAfterTransition(isOpen, { propertyName: "opacity" });

	useEffect(() => {
		if (!editor) return;
		const onSelectionUpdate = ({ editor }: { editor: Editor }) => {
			const canDisplay = canDisplayMenu(editor);
			setIsOpen(canDisplay);
		};

		editor.on("selectionUpdate", onSelectionUpdate);
		return () => {
			editor.off("selectionUpdate", onSelectionUpdate);
		};
	}, [editor]);

	return (
		<Portal parentId={id}>
			<div
				className={cn(
					"flex flex-col items-center gap-1 print:hidden",
					isMobile && "overflow-visible block gap-0 -ml-5 w-screen pb-0",
				)}
			>
				<div className="w-full" data-toolbar="bottom">
					{isActive(recorderState) && <ArticleAudioToolbar editor={editor} />}
					{shouldMount && (
						<div
							className={cn(
								"transition-[transform,opacity] duration-200 lg:shadow-hard-base rounded-lg",
								!isExpanded && "translate-y-2.5 opacity-0 pointer-events-none",
								isExpanded && "translate-y-0 opacity-100",
							)}
							onTransitionEnd={onTransitionEnd}
						>
							{children}
						</div>
					)}
				</div>
			</div>
		</Portal>
	);
};

export default Menu;
