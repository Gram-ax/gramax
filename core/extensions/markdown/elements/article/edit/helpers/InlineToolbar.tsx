import InlineEditPanel, {
	type InlineToolbarButtons,
} from "@ext/markdown/elements/article/edit/helpers/InlineEditPanel";
import { CustomBubbleMenu } from "@ext/markdown/elements/customBubbleMenu/edit/components/CustomBubbleMenu";
import type { Editor } from "@tiptap/react";
import { CellSelection, isInTable } from "prosemirror-tables";
import { memo, type RefObject, useCallback, useEffect, useRef, useState } from "react";
import "tippy.js/animations/shift-toward.css";
import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import { cssMedia } from "@core-ui/utils/cssUtils";
import type { Instance, Props } from "tippy.js";

interface InlineToolbarProps {
	editor: Editor;
	shouldShow: (props: { editor: Editor }) => boolean;
	pluginKey?: string;
	buttons?: InlineToolbarButtons;
	boundaryRef?: RefObject<HTMLElement>;
}

export interface InlineToolbarOptions {
	isInTable: boolean;
	isCellSelection: boolean;
}

export const InlineToolbar = memo(({ editor, pluginKey, buttons, shouldShow, boundaryRef }: InlineToolbarProps) => {
	const isMobile = useMediaQuery(cssMedia.JSnarrow);

	const [options, setOptions] = useState<InlineToolbarOptions>({
		isInTable: false,
		isCellSelection: false,
	});
	const tippyInstanceRef = useRef<Instance<Props>>(null);

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

	const onShow = useCallback((instance: Instance<Props>) => {
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const appendTo = useCallback(() => {
		return boundaryRef?.current ?? editor.view.dom.parentElement;
	}, [editor]);

	return (
		<CustomBubbleMenu
			editor={editor}
			pluginKey={pluginKey || "inline-toolbar"}
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
				<InlineEditPanel buttons={buttons} closeHandler={closeHandler} editor={editor} {...options} />
			</div>
		</CustomBubbleMenu>
	);
});
