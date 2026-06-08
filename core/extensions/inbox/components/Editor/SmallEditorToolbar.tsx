import ButtonStateService from "@core-ui/ContextServices/ButtonStateService/ButtonStateService";
import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
import type { ToolbarMenuProps } from "@ext/markdown/core/edit/components/Menu/Menus/Toolbar";
import ToolbarMenu from "@ext/markdown/core/edit/components/Menu/Menus/Toolbar";
import ToolbarWrapper from "@ext/markdown/core/edit/components/Menu/ToolbarWrapper";
import { useToolbarViewport } from "@ext/markdown/core/edit/logic/Toolbar/useToolbarViewport";
import type { Editor } from "@tiptap/core";

interface SmallEditorToolbarProps extends ToolbarMenuProps {
	editor: Editor;
}

const SmallEditorToolbarInner = ({ editor, ...menuProps }: SmallEditorToolbarProps) => {
	return (
		<div className="w-full" data-toolbar="bottom">
			<div className="lg:shadow-hard-base rounded-lg">
				<ButtonStateService.Provider editor={editor}>
					<ToolbarMenu editor={editor} isSmallEditor {...menuProps} />
				</ButtonStateService.Provider>
			</div>
		</div>
	);
};

const SmallEditorToolbar = ({ editor, ...menuProps }: SmallEditorToolbarProps) => {
	const isMobile = useMediaQuery(cssMedia.JSnarrow);
	const toolbarRef = useToolbarViewport();

	return (
		<div className="flex justify-center sticky z-[var(--z-index-toolbar)] left-0 right-0 bottom-1 pointer-events-none">
			<ToolbarWrapper className="transition-all duration-500 sm:[&>div]:rounded-lg" ref={toolbarRef}>
				<div
					className={cn(
						"flex flex-col items-center gap-1 print:hidden",
						isMobile && "overflow-visible block gap-0 w-screen pb-0",
					)}
				>
					<SmallEditorToolbarInner editor={editor} {...menuProps} />
				</div>
			</ToolbarWrapper>
		</div>
	);
};

export default SmallEditorToolbar;
