import styled from "@emotion/styled";
import { ChangeEventHandler } from "react";

let idCounter = 0;

const InputFile = styled(
	({
		children,
		onChange,
		className,
	}: {
		children: JSX.Element;
		onChange?: ChangeEventHandler<HTMLInputElement>;
		className?: string;
	}) => {
		const uniqueId = `file-input-${idCounter++}`;

		return (
			<label className={className} htmlFor={uniqueId}>
				<input type="file" id={uniqueId} onChange={onChange} />
				{children}
			</label>
		);
	},
)`
	position: relative;

	input[type="file"] {
		position: absolute;
		z-index: -1;
		opacity: 0;
		display: block;
		width: 0;
		height: 0%;
	}
`;

export default InputFile;
