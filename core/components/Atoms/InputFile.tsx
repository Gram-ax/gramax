import styled from "@emotion/styled";
import { ChangeEventHandler, useEffect, useRef } from "react";

let idCounter = 0;

interface InputFileProps {
	children: JSX.Element;
	className?: string;
	onChange?: ChangeEventHandler<HTMLInputElement>;
	onAbort?: () => void;
}

const InputFile = ({ children, onChange, onAbort, className }: InputFileProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const uniqueId = `file-input-${idCounter++}`;

	useEffect(() => {
		const input = inputRef.current;
		if (!input) return;

		input.addEventListener("cancel", onAbort);
		return () => input.removeEventListener("cancel", onAbort);
	}, [onAbort]);

	return (
		<label className={className} htmlFor={uniqueId}>
			<input id={uniqueId} onChange={onChange} ref={inputRef} type="file" />
			{children}
		</label>
	);
};

export default styled(InputFile)`
	position: relative;
	display: inline-block;

	input[type="file"] {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
`;
