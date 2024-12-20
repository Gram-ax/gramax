import { DiffEditor, loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

import DiffFileInput from "@components/Atoms/FileInput/DiffFileInput/DiffFileInputProps";
import "monaco-editor/esm/vs/basic-languages/markdown/markdown";

self.MonacoEnvironment = {
	getWorker() {
		return null;
	},
};

loader.config({ monaco });

loader.init();

const DiffFileInputBundle: DiffFileInput = (props) => {
	return <DiffEditor {...props} />;
};

export default DiffFileInputBundle;
