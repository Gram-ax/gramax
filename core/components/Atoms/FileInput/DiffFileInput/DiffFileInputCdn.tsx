import DiffFileInput from "@components/Atoms/FileInput/DiffFileInput/DiffFileInputProps";
import { DiffEditor } from "@monaco-editor/react";

const DiffFileInputCdn: DiffFileInput = (props) => {
	return <DiffEditor {...props} />;
};

export default DiffFileInputCdn;
