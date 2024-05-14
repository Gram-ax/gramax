
export interface FileInputProps {
	value: string;
	onChange: (value: string) => void;
	language: string;
	height?: string;
}

type FileInput = ({ value, language, onChange, height }: FileInputProps) => JSX.Element;

export default FileInput;
