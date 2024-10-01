import Tooltip from "@components/Atoms/Tooltip";

interface ChooseFileProps {
	extension?: string;
	onChange?: (file: File) => void;
	errorText?: string;
}

const ChooseFile = (props: ChooseFileProps) => {
	const { extension, onChange, errorText } = props;
	return (
		<Tooltip visible={!!errorText} content={<span>{errorText}</span>}>
			<input onChange={(e) => onChange(e.target.files[0])} type="file" accept={extension} />
		</Tooltip>
	);
};

export default ChooseFile;
