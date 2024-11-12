import styled from "@emotion/styled";
import { ChangeEventHandler } from "react";

let idCounter = 0;

interface InputFileProps {
	children: JSX.Element;
	onChange?: ChangeEventHandler<HTMLInputElement>;
	className?: string;
}

const InputFile = ({ children, onChange, className }: InputFileProps) => {
	const uniqueId = `file-input-${idCounter++}`;

	return (
		<label className={className} htmlFor={uniqueId}>
			<input type="file" id={uniqueId} onChange={onChange} />
			{children}
		</label>
	);
};

export default styled(InputFile)`
	position: relative;

	input[type="file"] {
		position: absolute;
		z-index: var(--z-index-background);
		opacity: 0;
		display: block;
		width: 0;
		height: 0%;
	}
`;
