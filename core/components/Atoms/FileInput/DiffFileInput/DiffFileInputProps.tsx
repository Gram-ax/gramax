import { DiffEditor } from "@monaco-editor/react";

export type DiffFileInputProps = React.ComponentProps<typeof DiffEditor> & {
	onChange?: (value: string) => void;
};

type DiffFileInput = (props: DiffFileInputProps) => JSX.Element;

export default DiffFileInput;
