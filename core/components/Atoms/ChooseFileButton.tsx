import Tooltip from "@components/Atoms/Tooltip";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import { useState } from "react";

interface ChooseFileProps {
	fileName?: string;
	extension?: string;
	errorText?: string;
	className?: string;
	onChange: (file: File) => void;
}

const ChooseFile = (props: ChooseFileProps) => {
	const { extension, onChange, errorText, className, fileName: fileNameProp } = props;
	const [fileName, setFileName] = useState(fileNameProp);

	useWatch(() => {
		setFileName(fileNameProp);
	}, [fileNameProp]);

	return (
		<Tooltip visible={!!errorText} content={<span>{errorText}</span>}>
			<div className={className + (errorText ? " error-file" : "")}>
				<span>
					{fileName ? "Файл" : "Выберите файл"}: {fileName ?? "Файл не выбран"}
				</span>
				<input
					onChange={(e) => {
						onChange(e.target.files[0]);
						setFileName(e.target.files[0].name);
					}}
					type="file"
					accept={extension}
				/>
			</div>
		</Tooltip>
	);
};

export default styled(ChooseFile)`
	cursor: pointer;
	position: relative;
	padding: 0.15em 0.3em;
	border-radius: var(--radius-small);
	background-color: var(--color-menu-bg);
	color: var(--color-article-heading-text);
	border: 1px solid var(--color-article-heading-text);

	&.error-file {
		text-decoration: var(--color-danger) wavy underline;
	}

	:hover {
		opacity: 0.8;
		color: var(--color-article-bg);
		background: var(--color-article-heading-text);
	}

	input[type="file"],
	input::file-selector-button {
		cursor: pointer;
	}

	input {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
	}
`;
