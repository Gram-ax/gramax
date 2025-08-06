import { editName as blockFieldEditName } from "@ext/markdown/elements/blockContentField/consts";
import { editName as blockPropertyEditName } from "@ext/markdown/elements/blockProperty/consts";
import { EditorState } from "@tiptap/pm/state";

export const readyToPlace = (editor: EditorState, nodeName: string, additional?: string[]) => {
	const { nodeReadyToPlace } = test(editor, nodeName, [
		...(additional ?? []),
		blockFieldEditName,
		blockPropertyEditName,
	]);

	return nodeReadyToPlace;
};

export const stopExecution = (editor: EditorState, nodeName: string, additional?: string[]) => {
	const { nodeReadyToToggle, nodeReadyToPlace } = test(editor, nodeName, [
		...(additional ?? []),
		blockFieldEditName,
		blockPropertyEditName,
	]);

	return !nodeReadyToToggle && !nodeReadyToPlace;
};

export const test = (state: EditorState, nodeName: string, additional?: string[]) => {
	const { selection } = state;
	let { $anchor } = selection;

	const result = { nodeReadyToToggle: false, nodeReadyToPlace: true };
	let attempt = 0;

	while ($anchor) {
		attempt += 1;

		if (!["doc", "paragraph", nodeName, ...(additional || [])].includes($anchor.parent.type.name)) {
			return { nodeReadyToToggle: false, nodeReadyToPlace: false };
		}

		if (attempt === 1 && $anchor.parent.type.name === "doc") {
			return { nodeReadyToToggle: false, nodeReadyToPlace: false };
		}

		if ($anchor.parent.type.name === nodeName) {
			result.nodeReadyToToggle = true;
			result.nodeReadyToPlace = false;
		}

		$anchor = $anchor.node($anchor.depth - 1) ? $anchor.doc.resolve($anchor.before($anchor.depth)) : null;
	}

	return result;
};
