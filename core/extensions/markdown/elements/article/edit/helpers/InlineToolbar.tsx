import InlineEditPanel from "@ext/markdown/elements/article/edit/helpers/InlineEditPanel";
import { Editor } from "@tiptap/react";
import { CustomBubbleMenu } from "@ext/markdown/elements/customBubbleMenu/edit/components/CustomBubbleMenu";
import { CellSelection, isInTable } from "prosemirror-tables";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import "tippy.js/animations/shift-toward.css";
import { useMediaQuery } from "@mui/material";
import { cssMedia } from "@core-ui/utils/cssUtils";

export interface InlineToolbarOptions {
	isInTable: boolean;
	isCellSelection: boolean;
}

export const InlineToolbar = memo(({ editor }: { editor: Editor }) => {
	const isMobile = useMediaQuery(cssMedia.JSnarrow);

	const [options, setOptions] = useState<InlineToolbarOptions>({
		isInTable: false,
		isCellSelection: false,
	});
	const tippyInstanceRef = useRef<any>(null);

	useEffect(() => {
		if (!editor || isMobile) return;

		const onSelectionUpdate = ({ editor }: { editor: Editor }) => {
			const inTable = isInTable(editor.state);
			const isCellSelection = editor.state.selection instanceof CellSelection;

			setOptions({
				isInTable: inTable,
				isCellSelection,
			});
		};

		editor.on("selectionUpdate", onSelectionUpdate);
		return () => {
			editor.off("selectionUpdate", onSelectionUpdate);
		};
	}, [editor, isMobile]);

	const shouldShow = useCallback(
		({ editor }: { editor: Editor }) => {
			if (isMobile) return false;

			const { from, to, empty } = editor.state.selection;
			if (empty) return false;

			const text = !!editor.state.doc.textBetween(from, to);
			const isCellSelection = editor.state.selection instanceof CellSelection;

			if ((!text && !isCellSelection) || editor.state.doc.firstChild === editor.state.selection.$from.parent) {
				return false;
			}

			return true;
		},
		[isMobile],
	);

	const onShow = useCallback((instance: any) => {
		tippyInstanceRef.current = instance;
		requestAnimationFrame(() => {
			if (instance?.popperInstance) {
				instance.popperInstance.update();
			}
		});
	}, []);

	const closeHandler = useCallback(() => {
		if (tippyInstanceRef.current) {
			tippyInstanceRef.current.hide();
		}
	}, []);

	const onHide = useCallback(() => {
		tippyInstanceRef.current = null;
		editor.commands.focus();
	}, [editor]);

	const appendTo = useCallback(() => {
		return editor.view.dom.parentElement;
	}, [editor]);

	return (
		<CustomBubbleMenu
			editor={editor}
			pluginKey="inline-toolbar"
			shouldShow={shouldShow}
			tippyOptions={{
				maxWidth: "unset",
				appendTo,
				interactive: true,
				arrow: false,
				sticky: true,
				offset: [0, 8],
				zIndex: 50,
				placement: "top-start",
				duration: [150, 150],
				animation: "shift-toward",
				moveTransition: "transform 0.150s ease-in-out",
				onShow,
				onHide,
			}}
		>
			<div className="lg:shadow-hard-base rounded-lg">
				<InlineEditPanel editor={editor} closeHandler={closeHandler} {...options} />
			</div>
		</CustomBubbleMenu>
	);
});
