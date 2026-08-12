import type DiffFileInput from "@components/Atoms/FileInput/DiffFileInput/DiffFileInputProps";
import getMonacoWorker from "@components/Atoms/FileInput/getMonacoWorker";
import { DiffEditor, loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import "monaco-editor/esm/vs/basic-languages/markdown/markdown";

self.MonacoEnvironment = {
	getWorker: getMonacoWorker,
};

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

const DiffFileInputBundle: DiffFileInput = (props) => {
	return <DiffEditor {...props} keepCurrentModifiedModel keepCurrentOriginalModel />;
};

export default DiffFileInputBundle;
