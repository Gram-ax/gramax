import FileInputType from "@components/Atoms/FileInput/FileInputProps";
import Editor from "@monaco-editor/react";

const FileInputCdn: FileInputType = (props) => {
	return <Editor {...props} />;
};

export default FileInputCdn;
