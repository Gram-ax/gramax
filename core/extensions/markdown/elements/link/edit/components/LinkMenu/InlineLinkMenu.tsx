import { useEscapeKeydown } from "@core-ui/hooks/useEscapeKeyDown";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { LinkMenu, type LinkMenuMode } from "@ext/markdown/elements/link/edit/components/LinkMenu/LinkMenu";
import { useLinkMenuState } from "@ext/markdown/elements/link/edit/hooks/useLinkMenuState";
import { getMarkEndPos } from "@ext/markdown/elementsUtils/getMarkEndPos";
import { getMarkStartPos } from "@ext/markdown/elementsUtils/getMarkStartPos";
import { useMediaQuery } from "@mui/material";
import { type Editor, posToDOMRect } from "@tiptap/react";
import { ComponentVariantProvider } from "@ui-kit/Providers";
import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import "tippy.js/animations/shift-toward.css";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import { CustomBubbleMenu } from "@ext/markdown/elements/customBubbleMenu/edit/components/CustomBubbleMenu";
import type { Instance, Placement, Props } from "tippy.js";

interface InlineLinkMenuProps {
	editor: Editor;
	fallbackPlacements?: Placement[];
	placement?: Placement;
	boundary?: "viewport" | "scrollParent" | "window" | HTMLElement;
	boundaryRef?: RefObject<HTMLElement>;
}

export const InlineLinkMenu = (props: InlineLinkMenuProps) => {
	const {
		editor,
		fallbackPlacements = ["top-start", "bottom-start"],
		placement = "bottom-start",
		boundary = "viewport",
		boundaryRef,
	} = props;
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
	const [mode, setMode] = useState<LinkMenuMode>(mark?.attrs?.href ? "view" : "edit");
	const instanceRef = useRef<Instance<Props>>(null);
	const articleRef = ArticleRefService.value;

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const onShow = useCallback(
		(instance: Instance<Props>) => {
			const commentBoundary = articleRef.current;
			if (commentBoundary) {
				instance.setProps({
					popperOptions: {
						modifiers: [
							{
								name: "flip",
								options: { fallbackPlacements, boundary: commentBoundary },
							},
							{
								name: "preventOverflow",
								options: { boundary: commentBoundary, padding: 8 },
							},
						],
					},
				});
			}

			requestAnimationFrame(() => {
				if (instance?.popperInstance) {
					instance.popperInstance.update();
				}
			});
		},
		[boundaryRef, fallbackPlacements],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		if (!instanceRef.current) return;
		requestAnimationFrame(() => {
			if (instanceRef.current?.popperInstance) {
				instanceRef.current.popperInstance.update();
			}
		});
	}, [mode]);

	useEscapeKeydown(reset);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const appendTo = useCallback(() => {
		return boundaryRef?.current ?? editor.view.dom.parentElement;
	}, [editor]);

	return (
		<CustomBubbleMenu
			editor={editor}
			pluginKey="new-link-menu"
			shouldShow={shouldShow}
			tippyOptions={{
				maxWidth: "unset",
				onCreate: (instance) => {
					instanceRef.current = instance;
				},
				appendTo,
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
								fallbackPlacements,
								boundary: boundaryRef ? "viewport" : boundary,
							},
						},
						{
							name: "preventOverflow",
							options: {
								boundary: boundaryRef ? "viewport" : boundary,
								padding: 8,
							},
						},
					],
				},
				duration: [150, 150],
				moveTransition: "transform 0.150s ease-in-out",
				animation: "shift-toward",
				placement,
				getReferenceClientRect,
				onShow,
				onHide: reset,
			}}
		>
			{!isMobile && (
				<ComponentVariantProvider variant="inverse">
					{mark && isOpen && (
						<LinkMenu
							mark={mark}
							mode={mode}
							onDelete={handleDelete}
							onUpdate={onUpdate}
							setMode={setMode}
						/>
					)}
				</ComponentVariantProvider>
			)}
		</CustomBubbleMenu>
	);
};
