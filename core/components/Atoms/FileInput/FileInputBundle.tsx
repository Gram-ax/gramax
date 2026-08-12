import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import type FileInputType from "./FileInputProps";
import getMonacoWorker from "./getMonacoWorker";

import "monaco-editor/esm/vs/basic-languages/markdown/markdown";

self.MonacoEnvironment = {
	getWorker: getMonacoWorker,
};

// #020617 references to hsl(var(--secondary-bg))

monaco.editor.defineTheme("new-vs-dark", {
	base: "vs-dark",
	inherit: true,
	rules: [],
	colors: {
		"editor.background": "#00000000",
		focusBorder: "#00000000",
	},
});

monaco.editor.defineTheme("article-dark", {
	base: "vs-dark",
	inherit: true,
	rules: [],
	colors: {
		"editor.background": "#00000000",
		focusBorder: "#00000000",
	},
});

loader.config({ monaco });

loader.init();

const FileInputBundle: FileInputType = (props) => {
	return <Editor {...props} />;
};

export default FileInputBundle;
