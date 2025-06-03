import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import FileInputType from "./FileInputProps";

import "monaco-editor/esm/vs/basic-languages/markdown/markdown";

self.MonacoEnvironment = {
	getWorker() {
		return null;
	},
};

// #020617 references to hsl(var(--secondary-bg))

monaco.editor.defineTheme("new-vs-dark", {
	base: "vs-dark",
	inherit: true,
	rules: [],
	colors: {
		"editor.background": "#020617",
	},
});

loader.config({ monaco });

loader.init();

const FileInputBundle: FileInputType = (props) => {
	return <Editor {...props} />;
};

export default FileInputBundle;
