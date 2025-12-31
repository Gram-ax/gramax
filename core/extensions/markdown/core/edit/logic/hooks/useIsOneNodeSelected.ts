import getIsSelectedOneNode from "@ext/markdown/elementsUtils/getIsSelectedOneNode";
import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";

export const useIsOneNodeSelected = (editor: Editor) => {
	const [isSelected, setIsSelected] = useState(false);

	useEffect(() => {
		if (!editor) return;
		const onSelectionUpdate = ({ editor }: { editor: Editor }) => {
			setIsSelected(getIsSelectedOneNode(editor.state));
		};

		editor.on("selectionUpdate", onSelectionUpdate);
		return () => {
			editor.off("selectionUpdate", onSelectionUpdate);
		};
	}, [editor]);

	return isSelected;
};
