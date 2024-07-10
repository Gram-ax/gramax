import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import FileInputType from "./FileInputProps";

import "monaco-editor/esm/vs/basic-languages/markdown/markdown";

self.MonacoEnvironment = {
	getWorker() {
		return null;
	},
};

loader.config({ monaco });

loader.init();

const FileInputBundle: FileInputType = (props) => {
	return <Editor {...props} />;
};

export default FileInputBundle;
