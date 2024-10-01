import FileInputMergeConflict from "@ext/git/actions/MergeConflictHandler/Monaco/logic/FileInputMergeConflict";
import { Editor } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import type * as monacoType from "monaco-editor/esm/vs/editor/editor.api";

export interface FileInputProps extends Omit<React.ComponentProps<typeof Editor>, "onChange" | "onMount"> {
	onChange?: (
		value: string,
		ev: editor.IModelContentChangedEvent,
		fileInputMergeConflict: FileInputMergeConflict,
	) => void;
	onMount?: (
		editor: editor.IStandaloneCodeEditor,
		monaco: typeof monacoType,
		fileInputMergeConflict: FileInputMergeConflict,
	) => void;
}

type FileInput = (props: React.ComponentProps<typeof Editor>) => JSX.Element;

export default FileInput;
