import { Editor } from "@tiptap/core";

const getLastNActions = (editor: Editor, n: number) => {
	const historyPlugin = editor.view.state.plugins.find(
		(plugin) => plugin.spec.key && (plugin.spec.key as any).key == "history$",
	);
	const { done } = historyPlugin.getState(editor.view.state);
	const lastActions = (done?.items?.values ?? []).slice(0, n);
	return lastActions;
};

export default getLastNActions;
