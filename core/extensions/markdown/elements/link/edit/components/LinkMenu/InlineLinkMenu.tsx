import { useEscapeKeydown } from "@core-ui/hooks/useEscapeKeyDown";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { LinkMenu } from "@ext/markdown/elements/link/edit/components/LinkMenu/LinkMenu";
import { useLinkMenuState } from "@ext/markdown/elements/link/edit/hooks/useLinkMenuState";
import { getMarkEndPos } from "@ext/markdown/elementsUtils/getMarkEndPos";
import { getMarkStartPos } from "@ext/markdown/elementsUtils/getMarkStartPos";
import { useMediaQuery } from "@mui/material";
import { Editor, posToDOMRect } from "@tiptap/react";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import { useCallback } from "react";
import "tippy.js/animations/shift-toward.css";
import { CustomBubbleMenu } from "@ext/markdown/elements/customBubbleMenu/edit/components/CustomBubbleMenu";

export const InlineLinkMenu = ({ editor }: { editor: Editor }) => {
	const {
		mark,
		isOpen,
		shouldShow: shouldShowLinkMenu,
		onUpdate,
		reset,
		getMark,
		handleDelete,
	} = useLinkMenuState(editor);
	const isMobile = useMediaQuery(cssMedia.JSnarrow);

	const shouldShow = useCallback(() => {
		if (isMobile) return false;
		return shouldShowLinkMenu();
	}, [shouldShowLinkMenu, isMobile]);

	const getReferenceClientRect = useCallback(() => {
		const { from, empty } = editor.state.selection;
		if (!empty) return { top: 0, left: 0, width: 0, height: 0 } as DOMRect;

		const docSize = editor.state.doc.content.size;
		if (from + 1 > docSize) return { top: 0, left: 0, width: 0, height: 0 } as DOMRect;

		const { after: nextMarkIsLink, before: beforeMarkIsLink, current: currentMarkIsLink } = getMark(from);

		if (!currentMarkIsLink && !nextMarkIsLink && !beforeMarkIsLink) {
			return { top: 0, left: 0, width: 0, height: 0 } as DOMRect;
		}

		const isActive = Boolean(currentMarkIsLink);
		const findPos = isActive ? from : nextMarkIsLink ? from + 1 : from - 1;
		const startPos = getMarkStartPos(editor.state.doc, "link", findPos);
		const endPos = getMarkEndPos(editor.state.doc, "link", findPos);

		return posToDOMRect(editor.view, startPos, endPos);
	}, [editor, getMark]);

	const onShow = useCallback((instance: any) => {
		requestAnimationFrame(() => {
			if (instance?.popperInstance) {
				instance.popperInstance.update();
			}
		});
	}, []);

	useEscapeKeydown(reset);

	return (
		<CustomBubbleMenu
			editor={editor}
			pluginKey="new-link-menu"
			shouldShow={shouldShow}
			tippyOptions={{
				maxWidth: "unset",
				appendTo: () => editor.view.dom.parentElement,
				interactive: true,
				arrow: false,
				sticky: true,
				offset: [-10, 8],
				zIndex: 50,
				popperOptions: {
					modifiers: [
						{
							name: "flip",
							options: {
								fallbackPlacements: ["top-start", "bottom-start"],
								boundary: "viewport",
							},
						},
						{
							name: "preventOverflow",
							options: {
								boundary: "viewport",
								padding: 8,
							},
						},
					],
				},
				duration: [150, 150],
				moveTransition: "transform 0.150s ease-in-out",
				animation: "shift-toward",
				placement: "bottom-start",
				getReferenceClientRect,
				onShow,
				onHide: reset,
			}}
		>
			{!isMobile && (
				<ComponentVariantProvider variant="inverse">
					{mark && isOpen && <LinkMenu mark={mark} onDelete={handleDelete} onUpdate={onUpdate} />}
				</ComponentVariantProvider>
			)}
		</CustomBubbleMenu>
	);
};
