import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import { cssMedia } from "@core-ui/utils/cssUtils";
import type { Editor } from "@tiptap/core";
import { CellSelection } from "prosemirror-tables";
import { useCallback } from "react";

export const useShouldShowInlineToolbar = () => {
	const isMobile = useMediaQuery(cssMedia.JSnarrow);

	return useCallback(
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
};
